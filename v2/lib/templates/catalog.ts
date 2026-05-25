// Phase 1 template catalog — minimal stubs.
// Each template is just a curated prompt that gets sent to the AI builder.
// Phase 2 will replace this with stored, editable templates.

export interface Template {
  id: string
  name: string
  category: 'business' | 'ecommerce' | 'portfolio' | 'blog' | 'restaurant' | 'clinic' | 'school' | 'landing'
  icon: string
  description: string
  prompt: string
  features: string[]
}

export const TEMPLATES: Template[] = [
  {
    id: 'biz-corporate',
    name: 'Corporate Agency',
    category: 'business',
    icon: '🏢',
    description: 'Professional landing for B2B services with stats, testimonials, and team.',
    prompt: 'Build a luxury corporate site for a digital agency called Apex with services, stats, testimonials, team, and contact',
    features: ['Hero with badge', 'Services grid', 'Stats counter', 'Testimonials', 'Team section'],
  },
  {
    id: 'biz-startup',
    name: 'Tech Startup',
    category: 'business',
    icon: '🚀',
    description: 'Modern SaaS landing with pricing tiers and trust signals.',
    prompt: 'Build a modern landing page for a SaaS startup called Nebula with pricing, FAQ, and a strong CTA',
    features: ['Spotlight hero', 'Pricing tiers', 'FAQ accordion', 'CTA banner'],
  },
  {
    id: 'shop-fashion',
    name: 'Fashion Store',
    category: 'ecommerce',
    icon: '👗',
    description: 'Elegant e-commerce landing with gallery and product highlights.',
    prompt: 'Build a luxury ecommerce site for a fashion brand called Atelier with gallery, testimonials, and contact',
    features: ['Bold hero', 'Product gallery', 'Customer reviews', 'Newsletter CTA'],
  },
  {
    id: 'shop-tech',
    name: 'Tech Store',
    category: 'ecommerce',
    icon: '🔌',
    description: 'Modern store layout with features, pricing, and FAQ.',
    prompt: 'Build a modern ecommerce site for an electronics store called Voltage with features, pricing, and FAQ',
    features: ['Modern hero', 'Feature grid', 'Pricing', 'FAQ'],
  },
  {
    id: 'port-creative',
    name: 'Creative Portfolio',
    category: 'portfolio',
    icon: '🎨',
    description: 'Visual-first portfolio for designers and creatives.',
    prompt: 'Build a minimal portfolio site for a designer with gallery, testimonials, and contact',
    features: ['Centered hero', 'Project gallery', 'Reviews', 'Contact form'],
  },
  {
    id: 'port-dev',
    name: 'Developer Portfolio',
    category: 'portfolio',
    icon: '💻',
    description: 'Code-focused portfolio with stats and project highlights.',
    prompt: 'Build a modern portfolio site for a software developer with stats, gallery, and contact',
    features: ['Asymmetric hero', 'Stats', 'Project gallery', 'Contact'],
  },
  {
    id: 'blog-tech',
    name: 'Tech Blog',
    category: 'blog',
    icon: '✍️',
    description: 'Clean editorial design for tech writing.',
    prompt: 'Build a minimal blog site for a tech writer with features and CTA',
    features: ['Minimal hero', 'Feature highlights', 'Newsletter CTA'],
  },
  {
    id: 'rest-fine',
    name: 'Fine Dining',
    category: 'restaurant',
    icon: '🍷',
    description: 'Elegant restaurant landing with gallery and reservations.',
    prompt: 'Build a luxury restaurant site for a fine dining place called Lumière with gallery, testimonials, and contact',
    features: ['Luxe hero', 'Menu highlights', 'Gallery', 'Reservations CTA'],
  },
  {
    id: 'rest-cafe',
    name: 'Casual Café',
    category: 'restaurant',
    icon: '☕',
    description: 'Warm, inviting café landing.',
    prompt: 'Build a cozy restaurant site for a cafe called Sunrise with features, testimonials, and contact',
    features: ['Centered hero', 'Daily specials', 'Reviews', 'Location'],
  },
  {
    id: 'clinic-modern',
    name: 'Medical Clinic',
    category: 'clinic',
    icon: '🏥',
    description: 'Trust-building healthcare site with team and services.',
    prompt: 'Build a modern clinic site for a medical practice with services, team, and contact',
    features: ['Trust hero', 'Services', 'Team', 'Booking CTA'],
  },
  {
    id: 'school-courses',
    name: 'Online Courses',
    category: 'school',
    icon: '🎓',
    description: 'Education platform with curriculum and testimonials.',
    prompt: 'Build a modern school site for an online learning platform with features, pricing, testimonials, and FAQ',
    features: ['Bold hero', 'Curriculum', 'Pricing', 'Reviews', 'FAQ'],
  },
  {
    id: 'landing-product',
    name: 'Product Launch',
    category: 'landing',
    icon: '🎯',
    description: 'High-conversion launch page with pricing.',
    prompt: 'Build a high-converting landing page for a new product launch with pricing, testimonials, FAQ, and CTA',
    features: ['Spotlight hero', 'Pricing', 'Testimonials', 'FAQ', 'CTA'],
  },
]

export const CATEGORIES = [
  { id: 'business',   name: 'Business',     icon: '🏢' },
  { id: 'ecommerce',  name: 'E-Commerce',   icon: '🛒' },
  { id: 'portfolio',  name: 'Portfolio',    icon: '👤' },
  { id: 'blog',       name: 'Blog',         icon: '✍️' },
  { id: 'restaurant', name: 'Restaurant',   icon: '🍔' },
  { id: 'clinic',     name: 'Medical',      icon: '🏥' },
  { id: 'school',     name: 'Education',    icon: '🎓' },
  { id: 'landing',    name: 'Landing Page', icon: '🎯' },
] as const
