"""
Computer control — real mouse + keyboard via pyautogui, so the assistant can
scroll, click, type and press keys on the actual desktop (not just launch apps).
Used by the automation agent and by WhatsApp真-send (open chat then press Enter).

Safety: pyautogui's FAILSAFE is ON — slamming the mouse to a screen corner
aborts any run. All actions are user-initiated through the assistant.
"""
import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)

try:
    import pyautogui
    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.15
    _OK = True
except Exception as e:  # missing display / not installed
    _OK = False
    logger.warning(f"pyautogui unavailable: {e}")


class ControlError(Exception):
    """User-presentable control failure."""


def available() -> bool:
    return _OK


def _ensure():
    if not _OK:
        raise ControlError("التحكم في الماوس/الكيبورد مش متاح على الجهاز ده")


def screen_size() -> dict:
    _ensure()
    w, h = pyautogui.size()
    return {"width": w, "height": h}


def move(x: int, y: int, duration: float = 0.25) -> dict:
    _ensure()
    pyautogui.moveTo(int(x), int(y), duration=duration)
    return {"moved": [int(x), int(y)]}


def click(x: Optional[int] = None, y: Optional[int] = None,
          button: str = "left", clicks: int = 1) -> dict:
    _ensure()
    btn = button if button in ("left", "right", "middle") else "left"
    if x is not None and y is not None:
        pyautogui.click(int(x), int(y), clicks=clicks, button=btn, interval=0.1)
    else:
        pyautogui.click(clicks=clicks, button=btn, interval=0.1)
    return {"clicked": [x, y], "button": btn, "clicks": clicks}


def double_click(x: Optional[int] = None, y: Optional[int] = None) -> dict:
    return click(x, y, clicks=2)


def scroll(amount: int = -500, x: Optional[int] = None, y: Optional[int] = None) -> dict:
    """Negative scrolls down, positive up."""
    _ensure()
    if x is not None and y is not None:
        pyautogui.moveTo(int(x), int(y))
    pyautogui.scroll(int(amount))
    return {"scrolled": int(amount)}


def type_text(text: str) -> dict:
    _ensure()
    # write() is ASCII-only; for Arabic/unicode go through the clipboard + paste.
    if text and any(ord(c) > 127 for c in text):
        try:
            import pyperclip
            pyperclip.copy(text)
            pyautogui.hotkey("ctrl", "v")
        except Exception:
            pyautogui.typewrite(text, interval=0.02)
    else:
        pyautogui.typewrite(text or "", interval=0.02)
    return {"typed_len": len(text or "")}


def press(keys: str) -> dict:
    """Press a key or a hotkey combo, e.g. 'enter' or 'ctrl+s'."""
    _ensure()
    parts = [k.strip().lower() for k in (keys or "").replace(" ", "").split("+") if k.strip()]
    if not parts:
        raise ControlError("قول الزرار")
    if len(parts) == 1:
        pyautogui.press(parts[0])
    else:
        pyautogui.hotkey(*parts)
    return {"pressed": "+".join(parts)}


def press_enter_after(delay: float = 2.6) -> dict:
    """Wait for a window to focus its input, then press Enter — used to真-send
    a WhatsApp message after the chat opened with text pre-filled."""
    _ensure()
    time.sleep(delay)
    pyautogui.press("enter")
    return {"sent": True}


def copy_file_to_clipboard(path: str) -> dict:
    """
    Put a FILE on the Windows clipboard (a file-drop), so it can be pasted as
    an attachment into apps like WhatsApp Desktop — the way you'd Ctrl+C a file
    in Explorer then Ctrl+V into a chat. Used to send a generated voice note.
    """
    import os
    import subprocess
    if not path or not os.path.exists(path):
        raise ControlError("الملف مش موجود عشان يتبعت")
    # Set-Clipboard -LiteralPath sets a CF_HDROP file list on the clipboard.
    safe = path.replace("'", "''")
    try:
        subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command",
             f"Set-Clipboard -LiteralPath '{safe}'"],
            check=True, capture_output=True, timeout=15,
        )
    except Exception as e:
        raise ControlError(f"مقدرتش أنسخ الملف للكليبورد: {e}")
    return {"copied": path}


def paste_file_and_send(paste_wait: float = 2.4, send_wait: float = 1.2) -> dict:
    """
    After a chat window is focused and a file is on the clipboard: paste it
    (Ctrl+V → media preview opens), wait, then Enter to send the attachment.
    """
    _ensure()
    pyautogui.hotkey("ctrl", "v")
    time.sleep(paste_wait)
    pyautogui.press("enter")
    time.sleep(send_wait)
    return {"sent": True}
