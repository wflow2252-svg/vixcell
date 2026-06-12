"""
System Info — gives the assistant full knowledge of the machine:
OS, CPU, RAM, GPU, disks, battery, network and uptime.

Prefers psutil for live resource numbers (fast, accurate) and falls back
to built-in Windows tools (CIM/WMI via PowerShell) when psutil isn't
installed, so it works even on a stock bundle. Static specs are cached;
live resources are read on every call.
"""
import json
import logging
import os
import platform
import shutil
import socket
import subprocess
import threading
import time
from typing import Optional

logger = logging.getLogger(__name__)

try:
    import psutil  # type: ignore
    _HAS_PSUTIL = True
except Exception:
    _HAS_PSUTIL = False

_static_cache: Optional[dict] = None
_static_lock = threading.Lock()


def _ps_json(script: str, timeout: int = 12):
    """Run a PowerShell snippet that emits JSON; return parsed data or None."""
    if os.name != "nt":
        return None
    try:
        out = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command",
             "[Console]::OutputEncoding=[Text.Encoding]::UTF8; " + script],
            capture_output=True, timeout=timeout,
        )
        raw = out.stdout.decode("utf-8", errors="replace").strip()
        return json.loads(raw) if raw else None
    except Exception as e:
        logger.warning(f"PowerShell query failed: {e}")
        return None


def _round_gb(n_bytes: float) -> float:
    return round(n_bytes / (1024 ** 3), 1)


# ── Static specs (cached for the process lifetime) ──────────────────────────────
def static_specs() -> dict:
    global _static_cache
    if _static_cache is not None:
        return _static_cache
    with _static_lock:
        if _static_cache is not None:
            return _static_cache

        specs = {
            "hostname": socket.gethostname(),
            "os": f"{platform.system()} {platform.release()}",
            "os_version": platform.version(),
            "arch": platform.machine(),
            "cpu_name": platform.processor() or "Unknown CPU",
            "cpu_cores": os.cpu_count(),
            "cpu_threads": os.cpu_count(),
            "ram_total_gb": None,
            "gpus": [],
            "username": os.environ.get("USERNAME") or os.environ.get("USER"),
        }

        if _HAS_PSUTIL:
            try:
                specs["cpu_cores"] = psutil.cpu_count(logical=False) or specs["cpu_cores"]
                specs["cpu_threads"] = psutil.cpu_count(logical=True) or specs["cpu_threads"]
                specs["ram_total_gb"] = _round_gb(psutil.virtual_memory().total)
            except Exception:
                pass

        # Windows: nicer CPU/GPU/RAM names from CIM
        if os.name == "nt":
            data = _ps_json(
                "$o=@{};"
                "$cpu=Get-CimInstance Win32_Processor | Select-Object -First 1;"
                "$o.cpu=$cpu.Name;$o.cores=$cpu.NumberOfCores;$o.threads=$cpu.NumberOfLogicalProcessors;"
                "$cs=Get-CimInstance Win32_ComputerSystem;"
                "$o.ram=[math]::Round($cs.TotalPhysicalMemory/1GB,1);$o.model=$cs.Model;$o.manufacturer=$cs.Manufacturer;"
                "$o.gpus=@(Get-CimInstance Win32_VideoController | ForEach-Object { $_.Name });"
                "$os=Get-CimInstance Win32_OperatingSystem;$o.osname=$os.Caption;"
                "$o | ConvertTo-Json -Compress"
            )
            if data:
                if data.get("cpu"):
                    specs["cpu_name"] = data["cpu"].strip()
                if data.get("cores"):
                    specs["cpu_cores"] = data["cores"]
                if data.get("threads"):
                    specs["cpu_threads"] = data["threads"]
                if data.get("ram"):
                    specs["ram_total_gb"] = data["ram"]
                if data.get("osname"):
                    specs["os"] = data["osname"].strip()
                if data.get("model"):
                    specs["device_model"] = f"{data.get('manufacturer','').strip()} {data['model'].strip()}".strip()
                gpus = data.get("gpus")
                specs["gpus"] = [gpus] if isinstance(gpus, str) else [g for g in (gpus or []) if g]

        _static_cache = specs
        return specs


# ── Live resources (read fresh every call) ──────────────────────────────────────
def _disks() -> list:
    disks = []
    if os.name == "nt":
        import string
        drives = [f"{d}:\\" for d in string.ascii_uppercase if os.path.exists(f"{d}:\\")]
    else:
        drives = ["/"]
    for d in drives:
        try:
            usage = shutil.disk_usage(d)
            disks.append({
                "drive": d.rstrip("\\"),
                "total_gb": _round_gb(usage.total),
                "free_gb": _round_gb(usage.free),
                "used_gb": _round_gb(usage.used),
                "percent_used": round(usage.used / usage.total * 100, 1) if usage.total else 0,
            })
        except Exception:
            continue
    return disks


def live_resources() -> dict:
    res = {"cpu_percent": None, "ram": {}, "disks": _disks(), "battery": None, "uptime_hours": None}

    if _HAS_PSUTIL:
        try:
            res["cpu_percent"] = round(psutil.cpu_percent(interval=0.3), 1)
            vm = psutil.virtual_memory()
            res["ram"] = {
                "total_gb": _round_gb(vm.total),
                "used_gb": _round_gb(vm.used),
                "free_gb": _round_gb(vm.available),
                "percent_used": round(vm.percent, 1),
            }
            bat = psutil.sensors_battery()
            if bat is not None:
                res["battery"] = {"percent": round(bat.percent), "plugged": bool(bat.power_plugged)}
            res["uptime_hours"] = round((time.time() - psutil.boot_time()) / 3600, 1)
            return res
        except Exception as e:
            logger.warning(f"psutil resource read failed, falling back: {e}")

    # PowerShell fallback (no psutil)
    if os.name == "nt":
        data = _ps_json(
            "$o=@{};"
            "$os=Get-CimInstance Win32_OperatingSystem;"
            "$o.ramFree=[math]::Round($os.FreePhysicalMemory/1MB,2);"
            "$o.ramTotal=[math]::Round($os.TotalVisibleMemorySize/1MB,2);"
            "$o.uptimeH=[math]::Round(((Get-Date)-$os.LastBootUpTime).TotalHours,1);"
            "$o.cpuLoad=(Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average;"
            "$b=Get-CimInstance Win32_Battery | Select-Object -First 1;"
            "if($b){$o.bat=$b.EstimatedChargeRemaining;$o.batStatus=$b.BatteryStatus};"
            "$o | ConvertTo-Json -Compress"
        )
        if data:
            total = data.get("ramTotal") or 0
            free = data.get("ramFree") or 0
            if total:
                res["ram"] = {
                    "total_gb": round(total, 1),
                    "used_gb": round(total - free, 1),
                    "free_gb": round(free, 1),
                    "percent_used": round((total - free) / total * 100, 1),
                }
            res["cpu_percent"] = data.get("cpuLoad")
            res["uptime_hours"] = data.get("uptimeH")
            if data.get("bat") is not None:
                # BatteryStatus 2 = plugged in / AC
                res["battery"] = {"percent": data["bat"], "plugged": data.get("batStatus") == 2}
    return res


def network_info() -> dict:
    info = {"hostname": socket.gethostname(), "local_ip": None}
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(("8.8.8.8", 80))
        info["local_ip"] = s.getsockname()[0]
        s.close()
    except Exception:
        try:
            info["local_ip"] = socket.gethostbyname(socket.gethostname())
        except Exception:
            pass
    return info


def device_overview() -> dict:
    """Everything the assistant knows about this machine."""
    from app.services import system_control
    specs = static_specs()
    res = live_resources()
    try:
        app_count = len(system_control.list_apps())
    except Exception:
        app_count = None
    return {
        **specs,
        "resources": res,
        "network": network_info(),
        "installed_app_count": app_count,
        "psutil": _HAS_PSUTIL,
    }


def spoken_summary(topic: str = "overview") -> str:
    """A natural Egyptian-Arabic sentence answering a machine question."""
    o = device_overview()
    res = o["resources"]
    ram = res.get("ram") or {}
    disks = res.get("disks") or []
    main_disk = next((d for d in disks if d["drive"].upper().startswith("C")), disks[0] if disks else None)
    bat = res.get("battery")

    def ram_line():
        if not ram:
            return "مش قادر أقرا الرام دلوقتي"
        return f"الرام {ram['total_gb']} جيجا، مستخدم منها {ram['used_gb']} وفاضي {ram['free_gb']} جيجا ({ram['percent_used']}%)"

    def disk_line():
        if not main_disk:
            return "مش قادر أقرا المساحة"
        return f"قرص {main_disk['drive']} فيه {main_disk['free_gb']} جيجا فاضية من إجمالي {main_disk['total_gb']}"

    def cpu_line():
        load = res.get("cpu_percent")
        load_txt = f"، شغال على {load}%" if load is not None else ""
        return f"المعالج {o['cpu_name']}، {o.get('cpu_cores','؟')} كور{load_txt}"

    def bat_line():
        if not bat:
            return "مفيش بطارية — الجهاز على الكهربا"
        plug = "وعلى الشاحن" if bat.get("plugged") else "وشغال على البطارية"
        return f"البطارية {bat['percent']}% {plug}"

    if topic == "ram":
        return ram_line()
    if topic == "disk":
        if not disks:
            return "مش قادر أقرا المساحة"
        parts = [f"{d['drive']} فيه {d['free_gb']} جيجا فاضية من {d['total_gb']}" for d in disks]
        return "المساحة: " + "؛ ".join(parts)
    if topic == "cpu":
        return cpu_line()
    if topic == "battery":
        return bat_line()
    if topic == "gpu":
        gpus = o.get("gpus") or []
        return ("كارت الشاشة: " + "، ".join(gpus)) if gpus else "مش لاقي معلومات كارت الشاشة"

    # Full overview
    gpu_txt = f"، كارت الشاشة {o['gpus'][0]}" if o.get("gpus") else ""
    return (
        f"جهازك {o.get('device_model') or o['hostname']}، نظام {o['os']}. "
        f"{cpu_line()}{gpu_txt}. {ram_line()}. {disk_line()}. {bat_line()}. "
        f"وفيه {o.get('installed_app_count','كذا')} برنامج متسطب."
    )
