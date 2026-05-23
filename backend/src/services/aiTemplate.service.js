exports.generateWebsite = async ({ businessName, businessType, description, primaryColor, language }) => {
  // A smart template-based engine replacing OpenAI to save costs and run faster.
  const isAr = language === 'ar' || language === 'both';
  const dir = isAr ? 'rtl' : 'ltr';
  const align = isAr ? 'right' : 'left';
  
  const strings = {
    heroTitle: isAr ? `مرحباً بك في ${businessName}` : `Welcome to ${businessName}`,
    heroDesc: description || (isAr ? `أفضل خدمة في مجال ${businessType}` : `The best ${businessType} service in town.`),
    cta: isAr ? 'احجز الآن' : 'Book Now',
    features: isAr ? 'خدماتنا' : 'Our Services',
    about: isAr ? 'من نحن' : 'About Us'
  };

  return `
<!DOCTYPE html>
<html lang="${language}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName}</title>
  <style>
    :root {
      --primary: ${primaryColor || '#6C63FF'};
      --bg: #ffffff;
      --text: #333333;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: var(--bg);
      color: var(--text);
      text-align: ${align};
    }
    header {
      background-color: var(--primary);
      color: white;
      padding: 2rem 1rem;
      text-align: center;
    }
    header h1 { margin: 0; font-size: 2.5rem; }
    header p { margin-top: 1rem; font-size: 1.2rem; opacity: 0.9; max-width: 600px; margin-inline: auto; }
    .btn {
      display: inline-block;
      margin-top: 2rem;
      padding: 0.8rem 2rem;
      background: white;
      color: var(--primary);
      text-decoration: none;
      font-weight: bold;
      border-radius: 30px;
      transition: transform 0.3s;
    }
    .btn:hover { transform: translateY(-3px); }
    section { padding: 4rem 2rem; max-width: 1000px; margin: 0 auto; }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    .feature-card {
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      background: white;
      text-align: center;
      border-top: 4px solid var(--primary);
    }
  </style>
</head>
<body>
  <header>
    <h1>${strings.heroTitle}</h1>
    <p>${strings.heroDesc}</p>
    <a href="#" class="btn">${strings.cta}</a>
  </header>
  
  <section>
    <h2>${strings.features}</h2>
    <div class="features-grid">
      <div class="feature-card">
        <h3>Feature 1</h3>
        <p>Premium quality and amazing support for your business needs.</p>
      </div>
      <div class="feature-card">
        <h3>Feature 2</h3>
        <p>Reliable and fast services tailored to the ${businessType} industry.</p>
      </div>
      <div class="feature-card">
        <h3>Feature 3</h3>
        <p>Modern solutions to keep you ahead of the competition.</p>
      </div>
    </div>
  </section>
</body>
</html>
  `;
};
