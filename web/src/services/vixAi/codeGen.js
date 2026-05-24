// ─── VIXCELL AI — Code Generator ────────────────────────────────────
// Generates production-ready code snippets for React, Node, Python,
// algorithms, auth flows, and common UI components.

import { normalize } from './intents.js'

// ─── Component Templates ────────────────────────────────────────────
const REACT_TEMPLATES = {
  button: `import React from 'react'

export default function Button({ children, variant = 'primary', loading = false, onClick, disabled, ...rest }) {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={\`\${variants[variant]} px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2\`}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" />
        </svg>
      )}
      {children}
    </button>
  )
}`,

  modal: `import React, { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const handleEsc = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={\`bg-white rounded-2xl shadow-2xl w-full \${sizes[size]} max-h-[90vh] overflow-hidden animate-scaleIn\`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none" aria-label="Close">
            &times;
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}`,

  card: `import React from 'react'

export default function Card({ title, subtitle, image, footer, children, onClick, hover = true }) {
  return (
    <div
      onClick={onClick}
      className={\`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all \${hover ? 'hover:shadow-lg hover:-translate-y-1' : ''} \${onClick ? 'cursor-pointer' : ''}\`}
    >
      {image && <img src={image} alt={title || ''} className="w-full h-48 object-cover" />}
      <div className="p-6">
        {title && <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>}
        {subtitle && <p className="text-sm text-gray-500 mb-3">{subtitle}</p>}
        {children}
      </div>
      {footer && <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">{footer}</div>}
    </div>
  )
}`,

  navbar: `import React, { useState } from 'react'

export default function Navbar({ brand, links = [] }) {
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-indigo-600">{brand}</span>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-8">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-gray-700 hover:text-indigo-600 transition-colors text-sm font-medium">
                {l.label}
              </a>
            ))}
          </div>
          <div className="md:hidden flex items-center">
            <button onClick={() => setOpen(!open)} className="text-gray-700 p-2" aria-label="Menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-200 px-4 py-3 space-y-2">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="block py-2 text-gray-700 hover:text-indigo-600">{l.label}</a>
          ))}
        </div>
      )}
    </nav>
  )
}`,

  form: `import React, { useState } from 'react'

export default function ContactForm({ onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.match(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/)) e.email = 'Valid email required'
    if (form.message.length < 10) e.message = 'Message must be at least 10 characters'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) return setErrors(errs)
    setErrors({})
    setSubmitting(true)
    try {
      await onSubmit?.(form)
      setForm({ name: '', email: '', message: '' })
    } finally {
      setSubmitting(false)
    }
  }

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input type="text" value={form.name} onChange={update('name')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" value={form.email} onChange={update('email')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea value={form.message} onChange={update('message')} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        {errors.message && <p className="text-red-600 text-sm mt-1">{errors.message}</p>}
      </div>
      <button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors">
        {submitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}`,

  dropdown: `import React, { useState, useRef, useEffect } from 'react'

export default function Dropdown({ trigger, items = [] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.onClick?.(); setOpen(false) }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}`,

  tabs: `import React, { useState } from 'react'

export default function Tabs({ tabs = [] }) {
  const [active, setActive] = useState(0)
  return (
    <div>
      <div className="border-b border-gray-200 flex gap-6">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={\`pb-3 -mb-px text-sm font-medium transition-colors border-b-2 \${
              active === i ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-700'
            }\`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="py-4">{tabs[active]?.content}</div>
    </div>
  )
}`,

  toggle: `import React, { useState } from 'react'

export default function Toggle({ defaultChecked = false, onChange, label }) {
  const [on, setOn] = useState(defaultChecked)
  function flip() {
    const next = !on
    setOn(next)
    onChange?.(next)
  }
  return (
    <label className="inline-flex items-center cursor-pointer gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={flip}
        className={\`relative w-11 h-6 rounded-full transition-colors \${on ? 'bg-indigo-600' : 'bg-gray-300'}\`}
      >
        <span className={\`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform \${on ? 'translate-x-5' : ''}\`} />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  )
}`,
}

// ─── Node/Express Templates ─────────────────────────────────────────
const NODE_TEMPLATES = {
  api: `// Express CRUD API — users resource
// npm i express cors

import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

// In-memory store (replace with DB in production)
let users = []
let nextId = 1

// List all
app.get('/api/users', (req, res) => {
  res.json({ data: users, total: users.length })
})

// Get one
app.get('/api/users/:id', (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id))
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

// Create
app.post('/api/users', (req, res) => {
  const { name, email } = req.body
  if (!name || !email) return res.status(400).json({ error: 'name and email required' })
  const user = { id: nextId++, name, email, createdAt: new Date().toISOString() }
  users.push(user)
  res.status(201).json(user)
})

// Update
app.patch('/api/users/:id', (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id))
  if (!user) return res.status(404).json({ error: 'User not found' })
  Object.assign(user, req.body)
  res.json(user)
})

// Delete
app.delete('/api/users/:id', (req, res) => {
  const idx = users.findIndex((u) => u.id === Number(req.params.id))
  if (idx === -1) return res.status(404).json({ error: 'User not found' })
  users.splice(idx, 1)
  res.status(204).end()
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(\`🚀 API running on http://localhost:\${PORT}\`))`,

  auth: `// JWT authentication middleware + login/register
// npm i express jsonwebtoken bcrypt

import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const app = express()
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production'
const users = new Map() // email → { id, email, hash }

// Register
app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email + password required' })
  if (password.length < 8) return res.status(400).json({ error: 'password too short' })
  if (users.has(email)) return res.status(409).json({ error: 'user exists' })

  const hash = await bcrypt.hash(password, 12)
  const user = { id: users.size + 1, email, hash }
  users.set(email, user)

  const token = jwt.sign({ sub: user.id, email }, JWT_SECRET, { expiresIn: '7d' })
  res.status(201).json({ token, user: { id: user.id, email } })
})

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  const user = users.get(email)
  if (!user) return res.status(401).json({ error: 'invalid credentials' })

  const valid = await bcrypt.compare(password, user.hash)
  if (!valid) return res.status(401).json({ error: 'invalid credentials' })

  const token = jwt.sign({ sub: user.id, email }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, email } })
})

// Auth middleware
function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'no token' })
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'invalid token' })
  }
}

// Protected route
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ userId: req.user.sub, email: req.user.email })
})

app.listen(3001, () => console.log('Auth API on :3001'))`,

  websocket: `// Real-time chat with Socket.io
// npm i express socket.io

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
const server = createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

const rooms = new Map() // roomId → Set of socketIds

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join', (roomId) => {
    socket.join(roomId)
    if (!rooms.has(roomId)) rooms.set(roomId, new Set())
    rooms.get(roomId).add(socket.id)
    io.to(roomId).emit('user-count', rooms.get(roomId).size)
  })

  socket.on('message', ({ roomId, text, user }) => {
    io.to(roomId).emit('message', {
      id: Date.now(),
      text,
      user,
      timestamp: new Date().toISOString(),
    })
  })

  socket.on('disconnect', () => {
    for (const [roomId, members] of rooms) {
      if (members.delete(socket.id)) {
        io.to(roomId).emit('user-count', members.size)
      }
    }
  })
})

server.listen(3001, () => console.log('🔌 Socket.io server on :3001'))`,

  upload: `// File upload with multer
// npm i express multer

import express from 'express'
import multer from 'multer'
import path from 'path'

const app = express()

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()))
  },
})

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' })
  res.json({
    filename: req.file.filename,
    size: req.file.size,
    url: \`/uploads/\${req.file.filename}\`,
  })
})

app.use('/uploads', express.static('uploads'))

app.listen(3001)`,
}

// ─── Python Templates ───────────────────────────────────────────────
const PYTHON_TEMPLATES = {
  fastapi: `# FastAPI CRUD example
# pip install fastapi uvicorn pydantic

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

app = FastAPI(title="Users API")


class UserIn(BaseModel):
    name: str
    email: EmailStr


class User(UserIn):
    id: int
    created_at: datetime


# In-memory store
users: list[User] = []
next_id = 1


@app.get("/api/users")
def list_users():
    return {"data": users, "total": len(users)}


@app.get("/api/users/{user_id}")
def get_user(user_id: int):
    user = next((u for u in users if u.id == user_id), None)
    if not user:
        raise HTTPException(404, "User not found")
    return user


@app.post("/api/users", status_code=201)
def create_user(payload: UserIn):
    global next_id
    user = User(id=next_id, created_at=datetime.utcnow(), **payload.dict())
    users.append(user)
    next_id += 1
    return user


@app.patch("/api/users/{user_id}")
def update_user(user_id: int, payload: UserIn):
    user = next((u for u in users if u.id == user_id), None)
    if not user:
        raise HTTPException(404, "User not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(user, k, v)
    return user


@app.delete("/api/users/{user_id}", status_code=204)
def delete_user(user_id: int):
    global users
    if not any(u.id == user_id for u in users):
        raise HTTPException(404, "User not found")
    users = [u for u in users if u.id != user_id]


# Run: uvicorn main:app --reload`,

  flask: `# Flask CRUD example
# pip install flask flask-cors

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

users = []
next_id = 1


@app.route("/api/users", methods=["GET"])
def list_users():
    return jsonify({"data": users, "total": len(users)})


@app.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = next((u for u in users if u["id"] == user_id), None)
    if not user:
        return jsonify({"error": "Not found"}), 404
    return jsonify(user)


@app.route("/api/users", methods=["POST"])
def create_user():
    global next_id
    data = request.get_json()
    if not data.get("name") or not data.get("email"):
        return jsonify({"error": "name + email required"}), 400
    user = {
        "id": next_id,
        "name": data["name"],
        "email": data["email"],
        "created_at": datetime.utcnow().isoformat(),
    }
    users.append(user)
    next_id += 1
    return jsonify(user), 201


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "internal error"}), 500


if __name__ == "__main__":
    app.run(port=3001, debug=True)`,

  webscraper: `# Web scraping with BeautifulSoup + requests
# pip install requests beautifulsoup4

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import csv

def scrape_articles(url: str, max_articles: int = 20) -> list[dict]:
    """Scrape article titles, URLs, and snippets from a blog index page."""
    headers = {"User-Agent": "Mozilla/5.0 (compatible; VixcellBot/1.0)"}
    res = requests.get(url, headers=headers, timeout=10)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")
    articles = []

    for article in soup.select("article")[:max_articles]:
        title_el = article.select_one("h1, h2, h3")
        link_el = article.select_one("a[href]")
        snippet_el = article.select_one("p")

        if not title_el or not link_el:
            continue

        articles.append({
            "title": title_el.get_text(strip=True),
            "url": urljoin(url, link_el["href"]),
            "snippet": snippet_el.get_text(strip=True) if snippet_el else "",
        })

    return articles


def save_csv(articles: list[dict], path: str = "articles.csv"):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["title", "url", "snippet"])
        writer.writeheader()
        writer.writerows(articles)


if __name__ == "__main__":
    results = scrape_articles("https://example-blog.com")
    save_csv(results)
    print(f"Saved {len(results)} articles to articles.csv")`,

  dataAnalysis: `# Data analysis quickstart with pandas
# pip install pandas matplotlib

import pandas as pd
import matplotlib.pyplot as plt

# Load data
df = pd.read_csv("data.csv")

# Quick inspection
print("Shape:", df.shape)
print("Columns:", df.columns.tolist())
print("\\nFirst rows:")
print(df.head())
print("\\nStats:")
print(df.describe())
print("\\nNulls per column:")
print(df.isnull().sum())

# Clean data
df = df.dropna(subset=["important_column"])  # drop rows missing critical data
df["date"] = pd.to_datetime(df["date"])       # parse dates
df = df[df["amount"] > 0]                     # filter outliers

# Group + aggregate
summary = (
    df.groupby(df["date"].dt.to_period("M"))
      .agg(total=("amount", "sum"), count=("amount", "count"), avg=("amount", "mean"))
      .reset_index()
)
print("\\nMonthly summary:")
print(summary)

# Visualize
fig, ax = plt.subplots(figsize=(10, 5))
ax.bar(summary["date"].astype(str), summary["total"])
ax.set_title("Monthly Total")
ax.set_xlabel("Month")
ax.set_ylabel("Total Amount")
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig("monthly_total.png", dpi=150)
print("\\nChart saved as monthly_total.png")`,
}

// ─── Algorithm Templates ────────────────────────────────────────────
const ALGORITHM_TEMPLATES = {
  quicksort: `// Quicksort — O(n log n) average, O(n²) worst case
function quicksort(arr) {
  if (arr.length <= 1) return arr
  const pivot = arr[Math.floor(arr.length / 2)]
  const left = arr.filter((x, i) => x < pivot)
  const middle = arr.filter((x) => x === pivot)
  const right = arr.filter((x, i) => x > pivot)
  return [...quicksort(left), ...middle, ...quicksort(right)]
}

console.log(quicksort([3, 6, 1, 8, 2, 9, 4]))  // [1, 2, 3, 4, 6, 8, 9]`,

  mergesort: `// Mergesort — O(n log n) guaranteed, stable
function mergesort(arr) {
  if (arr.length <= 1) return arr
  const mid = Math.floor(arr.length / 2)
  return merge(mergesort(arr.slice(0, mid)), mergesort(arr.slice(mid)))
}

function merge(left, right) {
  const result = []
  let i = 0, j = 0
  while (i < left.length && j < right.length) {
    result.push(left[i] <= right[j] ? left[i++] : right[j++])
  }
  return [...result, ...left.slice(i), ...right.slice(j)]
}`,

  binarySearch: `// Binary search — O(log n), array must be sorted
function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    if (arr[mid] === target) return mid
    if (arr[mid] < target) lo = mid + 1
    else hi = mid - 1
  }
  return -1
}`,

  fibonacci: `// Fibonacci — iterative is best, O(n) time, O(1) space
function fib(n) {
  if (n < 2) return n
  let [a, b] = [0, 1]
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b]
  return b
}

// Memoized recursive — also O(n) but uses stack
function fibMemo(n, memo = new Map()) {
  if (n < 2) return n
  if (memo.has(n)) return memo.get(n)
  const result = fibMemo(n - 1, memo) + fibMemo(n - 2, memo)
  memo.set(n, result)
  return result
}`,

  debounce: `// Debounce — fires only after \`wait\` ms of inactivity
function debounce(fn, wait) {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn.apply(this, args), wait)
  }
}

// Throttle — fires at most once per \`limit\` ms
function throttle(fn, limit) {
  let inThrottle = false
  return function (...args) {
    if (inThrottle) return
    fn.apply(this, args)
    inThrottle = true
    setTimeout(() => (inThrottle = false), limit)
  }
}

// Usage
const handleResize = debounce(() => console.log('resized'), 300)
window.addEventListener('resize', handleResize)`,

  deepClone: `// Deep clone — handles most types including circular refs
function deepClone(obj, seen = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj
  if (seen.has(obj)) return seen.get(obj)
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof RegExp) return new RegExp(obj)
  if (obj instanceof Map) {
    const m = new Map()
    seen.set(obj, m)
    obj.forEach((v, k) => m.set(deepClone(k, seen), deepClone(v, seen)))
    return m
  }
  if (obj instanceof Set) {
    const s = new Set()
    seen.set(obj, s)
    obj.forEach((v) => s.add(deepClone(v, seen)))
    return s
  }
  const clone = Array.isArray(obj) ? [] : Object.create(Object.getPrototypeOf(obj))
  seen.set(obj, clone)
  for (const key of Reflect.ownKeys(obj)) {
    clone[key] = deepClone(obj[key], seen)
  }
  return clone
}`,
}

// ─── Database Templates ─────────────────────────────────────────────
const DATABASE_TEMPLATES = {
  postgres: `-- PostgreSQL schema for a typical web app

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE posts (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) UNIQUE NOT NULL,
  content     TEXT,
  published   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published ON posts(published) WHERE published = true;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();`,

  prisma: `// Prisma schema — modern ORM for Node.js + TypeScript

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           BigInt   @id @default(autoincrement())
  email        String   @unique @db.VarChar(255)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  name         String?  @db.VarChar(255)
  posts        Post[]
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model Post {
  id        BigInt   @id @default(autoincrement())
  userId    BigInt   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String   @db.VarChar(255)
  slug      String   @unique @db.VarChar(255)
  content   String?  @db.Text
  published Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([userId])
  @@index([slug])
  @@index([published])
  @@map("posts")
}`,

  mongoose: `// Mongoose schema — MongoDB ODM for Node.js

import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: String,
}, { timestamps: true })

userSchema.index({ email: 1 })

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: String,
  published: { type: Boolean, default: false, index: true },
}, { timestamps: true })

postSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
})

export const User = mongoose.model('User', userSchema)
export const Post = mongoose.model('Post', postSchema)`,
}

// ─── Generator Functions ────────────────────────────────────────────
function pickReactTemplate(text) {
  const norm = normalize(text)
  if (/\b(button|زرار|btn)\b/.test(norm)) return { key: 'button', code: REACT_TEMPLATES.button }
  if (/\b(modal|dialog|popup|نافذة|نافذه|مودال|بوب|پوپ)\b/.test(norm)) return { key: 'modal', code: REACT_TEMPLATES.modal }
  if (/\b(card|كارت)\b/.test(norm)) return { key: 'card', code: REACT_TEMPLATES.card }
  if (/\b(navbar|navigation|nav|header|قائمة)\b/.test(norm)) return { key: 'navbar', code: REACT_TEMPLATES.navbar }
  if (/\b(form|input|validation|فورم|نموذج)\b/.test(norm)) return { key: 'form', code: REACT_TEMPLATES.form }
  if (/\b(dropdown|menu|select|قائمة منسدلة)\b/.test(norm)) return { key: 'dropdown', code: REACT_TEMPLATES.dropdown }
  if (/\b(tabs|tab|تابز)\b/.test(norm)) return { key: 'tabs', code: REACT_TEMPLATES.tabs }
  if (/\b(toggle|switch|سويتش)\b/.test(norm)) return { key: 'toggle', code: REACT_TEMPLATES.toggle }
  return null
}

function pickNodeTemplate(text) {
  const norm = normalize(text)
  if (/\b(auth|jwt|login|signup|register|توثيق|تسجيل)\b/.test(norm)) return { key: 'auth', code: NODE_TEMPLATES.auth }
  if (/\b(websocket|socket|realtime|chat|شات)\b/.test(norm)) return { key: 'websocket', code: NODE_TEMPLATES.websocket }
  if (/\b(upload|file|multer|رفع ملف|ملفات)\b/.test(norm)) return { key: 'upload', code: NODE_TEMPLATES.upload }
  return { key: 'api', code: NODE_TEMPLATES.api }
}

function pickPythonTemplate(text) {
  const norm = normalize(text)
  if (/\b(flask|فلاسك)\b/.test(norm)) return { key: 'flask', code: PYTHON_TEMPLATES.flask }
  if (/\b(scrape|scraping|crawl|سحب بيانات|كشط)\b/.test(norm)) return { key: 'scraper', code: PYTHON_TEMPLATES.webscraper }
  if (/\b(pandas|analy[sz]e|data|تحليل بيانات|csv|dataframe)\b/.test(norm)) return { key: 'pandas', code: PYTHON_TEMPLATES.dataAnalysis }
  return { key: 'fastapi', code: PYTHON_TEMPLATES.fastapi }
}

function pickAlgorithm(text) {
  const norm = normalize(text)
  if (/\b(quicksort|quick sort)\b/.test(norm)) return { key: 'quicksort', code: ALGORITHM_TEMPLATES.quicksort }
  if (/\b(mergesort|merge sort)\b/.test(norm)) return { key: 'mergesort', code: ALGORITHM_TEMPLATES.mergesort }
  if (/\b(binary search|بحث ثنائي|binary)\b/.test(norm)) return { key: 'binarySearch', code: ALGORITHM_TEMPLATES.binarySearch }
  if (/\b(fibonacci|فيبوناتشي|fib)\b/.test(norm)) return { key: 'fibonacci', code: ALGORITHM_TEMPLATES.fibonacci }
  if (/\b(debounce|throttle)\b/.test(norm)) return { key: 'debounce', code: ALGORITHM_TEMPLATES.debounce }
  if (/\b(deep clone|clone|نسخ عميق)\b/.test(norm)) return { key: 'deepClone', code: ALGORITHM_TEMPLATES.deepClone }
  return null
}

function pickDatabase(text) {
  const norm = normalize(text)
  if (/\b(prisma|بريزما)\b/.test(norm)) return { key: 'prisma', code: DATABASE_TEMPLATES.prisma, lang: 'prisma' }
  if (/\b(mongoose|mongodb|nosql|مونجو)\b/.test(norm)) return { key: 'mongoose', code: DATABASE_TEMPLATES.mongoose, lang: 'javascript' }
  return { key: 'postgres', code: DATABASE_TEMPLATES.postgres, lang: 'sql' }
}

// ─── Main Generator API ─────────────────────────────────────────────
export function generateCode(kind, text) {
  switch (kind) {
    case 'react':
    case 'component': {
      const t = pickReactTemplate(text)
      return t ? { lang: 'jsx', ...t } : null
    }
    case 'node': {
      const t = pickNodeTemplate(text)
      return { lang: 'javascript', ...t }
    }
    case 'python': {
      const t = pickPythonTemplate(text)
      return { lang: 'python', ...t }
    }
    case 'algorithm': {
      const t = pickAlgorithm(text)
      return t ? { lang: 'javascript', ...t } : null
    }
    case 'database': {
      return pickDatabase(text)
    }
    case 'api': {
      const t = pickNodeTemplate(text)
      return { lang: 'javascript', ...t }
    }
    case 'auth': {
      return { lang: 'javascript', key: 'auth', code: NODE_TEMPLATES.auth }
    }
    case 'form': {
      return { lang: 'jsx', key: 'form', code: REACT_TEMPLATES.form }
    }
    default:
      return null
  }
}

export function formatCodeResponse(result, lang = 'en') {
  if (!result) return null
  const { lang: codeLang, code, key } = result
  const labelEn = {
    button: 'React Button Component',
    modal: 'React Modal Component',
    card: 'React Card Component',
    navbar: 'React Navbar with Mobile Menu',
    form: 'React Form with Validation',
    dropdown: 'React Dropdown Menu',
    tabs: 'React Tabs Component',
    toggle: 'React Toggle Switch',
    api: 'Node + Express CRUD API',
    auth: 'JWT Authentication (Login + Register)',
    websocket: 'Real-time Chat with Socket.io',
    upload: 'File Upload with Multer',
    fastapi: 'Python FastAPI CRUD',
    flask: 'Python Flask CRUD',
    scraper: 'Python Web Scraper',
    pandas: 'Python Data Analysis with pandas',
    quicksort: 'Quicksort Algorithm',
    mergesort: 'Mergesort Algorithm',
    binarySearch: 'Binary Search',
    fibonacci: 'Fibonacci (Iterative + Memoized)',
    debounce: 'Debounce + Throttle',
    deepClone: 'Deep Clone Utility',
    postgres: 'PostgreSQL Schema',
    prisma: 'Prisma Schema',
    mongoose: 'Mongoose Models',
  }
  const labelAr = {
    button: 'React Button Component',
    modal: 'React Modal Component',
    card: 'React Card Component',
    navbar: 'Navbar مع قائمة موبايل',
    form: 'فورم React مع validation',
    dropdown: 'Dropdown Menu',
    tabs: 'Tabs Component',
    toggle: 'Toggle Switch',
    api: 'Node + Express CRUD API',
    auth: 'تسجيل دخول/تسجيل بـ JWT',
    websocket: 'شات realtime بـ Socket.io',
    upload: 'رفع ملفات بـ Multer',
    fastapi: 'Python FastAPI CRUD',
    flask: 'Python Flask CRUD',
    scraper: 'Web Scraper بـ Python',
    pandas: 'تحليل بيانات بـ pandas',
    quicksort: 'خوارزمية Quicksort',
    mergesort: 'خوارزمية Mergesort',
    binarySearch: 'البحث الثنائي (Binary Search)',
    fibonacci: 'Fibonacci (iterative + memoized)',
    debounce: 'Debounce + Throttle',
    deepClone: 'Deep Clone Utility',
    postgres: 'Schema لـ PostgreSQL',
    prisma: 'Prisma Schema',
    mongoose: 'Mongoose Models',
  }
  const labels = lang === 'ar' ? labelAr : labelEn
  const title = labels[key] || key

  return `**${title}**\n\n\`\`\`${codeLang}\n${code}\n\`\`\``
}

// ─── Snippet utility — quick one-liners ─────────────────────────────
export const SNIPPETS = {
  uuid: `// Generate UUID v4 (modern, no library needed)
crypto.randomUUID()`,

  fetch: `// Modern fetch with timeout
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
    return await res.json()
  } finally {
    clearTimeout(id)
  }
}`,

  shuffle: `// Fisher-Yates shuffle
function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}`,

  formatDate: `// Format dates without a library
function formatDate(date, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}`,
}
