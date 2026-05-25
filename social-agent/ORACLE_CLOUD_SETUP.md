# Oracle Cloud Always-Free Setup — VIXCELL Social Agent

دليل خطوة بخطوة لاستضافة الـ Social Agent على **Oracle Cloud Free Tier** (مجاني للأبد، 24GB RAM).

## ١. إنشاء حساب Oracle Cloud (مرة واحدة)

1. روح https://signup.cloud.oracle.com/
2. سجّل حساب جديد — هيطلب منك:
   - بريد إلكتروني وكلمة سر
   - **بطاقة ائتمان للتحقق** (مفيش خصم — هي للتأكد إنك مش بوت)
   - رقم موبايل
   - **Region**: اختار **Frankfurt** أو **London** (أقرب للشرق الأوسط)
3. لما تخلص، اختار **Always-Free** فقط (مش Pay-As-You-Go)

> ⚠️ مهم: عند الإنشاء، تأكد إن الـ **Home Region** هي اللي اخترتها — مش هتقدر تغيرها بعدين.

## ٢. إنشاء VM Instance (مجاني)

من Oracle Cloud Console → **Compute → Instances → Create Instance**:

| الحقل | القيمة |
|------|--------|
| Name | `vixcell-social-agent` |
| **Image** | Canonical **Ubuntu 22.04** |
| **Shape** | **Ampere A1 Flex** — 4 OCPUs, 24 GB RAM (Always-Free eligible ✅) |
| Networking | Create new VCN with internet connectivity |
| Public IPv4 | **Assign a public IPv4 address** ✅ |
| SSH Keys | Generate a new pair → **Download both files** (private + public) |

اضغط **Create**. الانتظار ١-٢ دقيقة.

> 💡 لو طلع لك "Out of capacity" — جرّب region تاني (مثل Phoenix أو Ashburn). Ampere A1 محدود في بعض المناطق.

## ٣. ربط SSH

سجل الـ **Public IPv4** اللي ظهر في صفحة الـ instance.

من PowerShell على Windows:
```powershell
# نقل المفتاح الخاص لمكان آمن
mkdir $env:USERPROFILE\.ssh -Force
move ~\Downloads\ssh-key-*.key $env:USERPROFILE\.ssh\oracle.key
icacls $env:USERPROFILE\.ssh\oracle.key /inheritance:r /grant:r "$env:USERNAME:R"

# دخول
ssh -i $env:USERPROFILE\.ssh\oracle.key ubuntu@<your-public-ip>
```

## ٤. فتح الـ Ports في Oracle (مهم!)

Oracle بيقفل كل الـ ports default. لازم تفتح ٨٠ و٤٤٣:

من Console → Networking → **Virtual Cloud Networks** → اختار الـ VCN → **Security Lists** → **Default Security List** → **Add Ingress Rules**:

| Source | Protocol | Port | Description |
|--------|----------|------|-------------|
| `0.0.0.0/0` | TCP | 80 | HTTP |
| `0.0.0.0/0` | TCP | 443 | HTTPS |

(الـ 22 SSH مفتوح أصلاً)

## ٥. إعداد Firewall داخل الـ VM

```bash
# من جلسة SSH
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## ٦. تشغيل الـ Bootstrap Script

```bash
# على الـ VM
curl -sSL https://raw.githubusercontent.com/wflow2252-svg/vixcell/main/social-agent/scripts/oracle-bootstrap.sh | sudo bash
```

السكريبت بيعمل تلقائياً:
- ✅ تحديث النظام
- ✅ تثبيت Docker + Docker Compose
- ✅ Clone الـ repo في `/opt/vixcell`
- ✅ إنشاء `.env` من template
- ✅ تثبيت Nginx + Certbot
- ✅ بناء الـ Docker container
- ✅ إعداد reverse proxy لـ `agent.vixcell.com`

## ٧. ضبط الـ AGENT_TOKEN

```bash
sudo nano /opt/vixcell/social-agent/.env
```

غيّر `AGENT_TOKEN` لنفس القيمة اللي في `web/.env.local` على Vercel:
```
AGENT_TOKEN=92184e27679df5376e9219fa850e680301a1214b2280480f20678c55879d8638
```

أعد التشغيل:
```bash
cd /opt/vixcell/social-agent && sudo docker compose restart
```

## ٨. ربط الـ DNS

في Hostinger DNS لـ `vixcell.com`، ضيف:
```
Type: A   |  Name: agent   |  Value: <oracle-public-ip>   |  TTL: 3600
```

استنّى ٥-١٠ دقايق للـ propagation، بعدها:
```bash
sudo certbot --nginx -d agent.vixcell.com --non-interactive --agree-tos --email vixcell.eg@gmail.com --redirect
```

## ٩. تحديث Vercel

في Vercel Dashboard → web project → Environment Variables، **حدّث** أو **ضيف**:
```
VITE_SOCIAL_AGENT_URL=https://agent.vixcell.com
VITE_SOCIAL_AGENT_TOKEN=92184e27679df5376e9219fa850e680301a1214b2280480f20678c55879d8638
```

اعمل **Redeploy** للموقع. (`vercel --prod` أو من Dashboard).

## ١٠. تسجيل دخول Gemini (مرة واحدة فقط)

السيرفر مفيهوش شاشة، فلازم نسجل Gemini عبر VNC مرة واحدة:

```bash
# على الـ VM
sudo apt install -y xvfb x11vnc novnc websockify

# عدّل docker-compose مؤقتاً
sudo nano /opt/vixcell/social-agent/.env
# غيّر: HEADED=true

# شغّل xvfb + container
sudo docker compose down
sudo nohup Xvfb :99 -screen 0 1280x800x24 &
DISPLAY=:99 sudo docker compose up -d
sudo x11vnc -display :99 -listen 127.0.0.1 -nopw -forever -shared &
sudo websockify --web=/usr/share/novnc 6080 localhost:5900 &
```

من جهازك:
```powershell
# SSH tunnel
ssh -i $env:USERPROFILE\.ssh\oracle.key -L 6080:127.0.0.1:6080 ubuntu@<oracle-ip>
```

افتح في المتصفح: http://localhost:6080/vnc.html → **Connect** → هتشوف شاشة Linux فيها Chromium مفتوح على Gemini → سجّل دخولك بحساب AI Pro.

بعد الانتهاء:
```bash
sudo docker compose down
# رجّع HEADED=false في .env
sudo docker compose up -d
```

الـ session هتفضل محفوظة في الـ Docker volume.

## ١١. اختبار

افتح https://vixcell.com/admin → تاب **🤖 Social Agent** → الحالة لازم تبقى **متصل ✅**.

اضغط زرار "بوست عربي" → هتشوف live screenshot من السيرفر.

---

## 📈 المراقبة

```bash
# Logs مباشرة
cd /opt/vixcell/social-agent && sudo docker compose logs -f

# استخدام الموارد
sudo docker stats vixcell-social-agent

# Restart لو في مشكلة
sudo docker compose restart
```

## 🔄 التحديث

لما تطلع نسخة جديدة:
```bash
cd /opt/vixcell && sudo git pull
cd social-agent && sudo docker compose up -d --build
```

## 💰 التكلفة

كل شهر: **$0.00** ✅ (Always-Free Tier)

> ⚠️ **مهم**: لو الـ instance قعد ٧ أيام بدون نشاط Oracle ممكن يوقفه. اضمن نشاط بسيط (cron يطلب /health كل يوم).
