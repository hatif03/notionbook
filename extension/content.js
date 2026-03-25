(function() {
  if (window.__pmPrototyperLoaded) return;
  window.__pmPrototyperLoaded = true;

  const STORAGE_KEY = "pm-prototyper-mockups";
  let isToolbarVisible = false;
  let selectedComponent = null;
  let components = [];
  let componentIdCounter = 0;
  let apiUrl = "http://localhost:3001";
  let isDraggingToolbar = false;
  let toolbarOffset = { x: 0, y: 0 };

  // Extended Component Library
  const componentLibrary = [
    // Basic Components
    { type: "button", name: "Button", icon: "🔘", category: "basic", html: '<button style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: system-ui, sans-serif;">Click Me</button>' },
    { type: "button-outline", name: "Outline Btn", icon: "⭕", category: "basic", html: '<button style="padding: 10px 20px; background: transparent; color: #3b82f6; border: 1px solid #3b82f6; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: system-ui, sans-serif;">Click Me</button>' },
    { type: "text", name: "Text", icon: "📝", category: "basic", html: '<p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0; font-family: system-ui, sans-serif;">Edit this text by double-clicking. Add your content here.</p>' },
    { type: "heading", name: "Heading", icon: "🔤", category: "basic", html: '<h2 style="font-size: 28px; font-weight: 700; color: #111827; margin: 0; font-family: system-ui, sans-serif;">Section Heading</h2>' },
    { type: "subheading", name: "Subheading", icon: "📰", category: "basic", html: '<h3 style="font-size: 20px; font-weight: 600; color: #374151; margin: 0; font-family: system-ui, sans-serif;">Subheading Text</h3>' },
    { type: "link", name: "Link", icon: "🔗", category: "basic", html: '<a href="#" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500; font-family: system-ui, sans-serif;">Learn more →</a>' },
    
    // Form Components
    { type: "input", name: "Input", icon: "📋", category: "form", html: '<input type="text" placeholder="Enter text..." style="padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; width: 240px; font-family: system-ui, sans-serif; outline: none;">' },
    { type: "textarea", name: "Textarea", icon: "📄", category: "form", html: '<textarea placeholder="Enter your message..." style="padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; width: 280px; height: 100px; font-family: system-ui, sans-serif; outline: none; resize: none;"></textarea>' },
    { type: "checkbox", name: "Checkbox", icon: "☑️", category: "form", html: '<label style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #374151; font-family: system-ui, sans-serif; cursor: pointer;"><input type="checkbox" style="width: 16px; height: 16px; accent-color: #3b82f6;"> I agree to the terms</label>' },
    { type: "select", name: "Select", icon: "📋", category: "form", html: '<select style="padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; width: 200px; font-family: system-ui, sans-serif; background: white;"><option>Select option...</option><option>Option 1</option><option>Option 2</option><option>Option 3</option></select>' },
    
    // Cards & Containers
    { type: "card", name: "Card", icon: "🃏", category: "card", html: '<div style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; padding: 20px; width: 300px;"><h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827; font-family: system-ui, sans-serif;">Card Title</h3><p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5; font-family: system-ui, sans-serif;">This is a card component with a clean design.</p></div>' },
    { type: "card-image", name: "Image Card", icon: "🖼️", category: "card", html: '<div style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; width: 280px;"><div style="height: 160px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div><div style="padding: 16px;"><h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827; font-family: system-ui, sans-serif;">Featured Item</h3><p style="margin: 0; color: #6b7280; font-size: 14px; font-family: system-ui, sans-serif;">Brief description here.</p></div></div>' },
    { type: "pricing", name: "Pricing", icon: "💰", category: "card", html: '<div style="background: white; border-radius: 12px; border: 2px solid #3b82f6; padding: 24px; width: 280px; text-align: center;"><p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #3b82f6; font-family: system-ui, sans-serif;">PRO PLAN</p><p style="margin: 0 0 16px 0; font-size: 48px; font-weight: 700; color: #111827; font-family: system-ui, sans-serif;">$29<span style="font-size: 16px; color: #6b7280; font-weight: 400;">/mo</span></p><ul style="margin: 0 0 20px 0; padding: 0; list-style: none; text-align: left;"><li style="padding: 8px 0; color: #374151; font-size: 14px; font-family: system-ui, sans-serif;">✓ Unlimited projects</li><li style="padding: 8px 0; color: #374151; font-size: 14px; font-family: system-ui, sans-serif;">✓ Priority support</li><li style="padding: 8px 0; color: #374151; font-size: 14px; font-family: system-ui, sans-serif;">✓ Advanced analytics</li></ul><button style="width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: system-ui, sans-serif;">Get Started</button></div>' },
    { type: "testimonial", name: "Testimonial", icon: "💬", category: "card", html: '<div style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; padding: 20px; width: 320px;"><p style="margin: 0 0 16px 0; color: #374151; font-size: 14px; line-height: 1.6; font-style: italic; font-family: system-ui, sans-serif;">"This product has completely transformed how we work. Highly recommended!"</p><div style="display: flex; align-items: center; gap: 12px;"><div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div><div><p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827; font-family: system-ui, sans-serif;">Sarah Johnson</p><p style="margin: 0; font-size: 12px; color: #6b7280; font-family: system-ui, sans-serif;">CEO at TechCorp</p></div></div></div>' },
    
    // UI Elements
    { type: "badge", name: "Badge", icon: "🏷️", category: "ui", html: '<span style="background: #dbeafe; color: #1d4ed8; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; font-family: system-ui, sans-serif;">New Feature</span>' },
    { type: "badge-success", name: "Success Badge", icon: "✅", category: "ui", html: '<span style="background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; font-family: system-ui, sans-serif;">Active</span>' },
    { type: "avatar", name: "Avatar", icon: "👤", category: "ui", html: '<div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 18px; font-family: system-ui, sans-serif;">JD</div>' },
    { type: "avatar-group", name: "Avatar Group", icon: "👥", category: "ui", html: '<div style="display: flex;"><div style="width: 36px; height: 36px; border-radius: 50%; background: #3b82f6; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 12px; font-family: system-ui, sans-serif;">A</div><div style="width: 36px; height: 36px; border-radius: 50%; background: #8b5cf6; border: 2px solid white; margin-left: -8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 12px; font-family: system-ui, sans-serif;">B</div><div style="width: 36px; height: 36px; border-radius: 50%; background: #ec4899; border: 2px solid white; margin-left: -8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 12px; font-family: system-ui, sans-serif;">C</div><div style="width: 36px; height: 36px; border-radius: 50%; background: #e5e7eb; border: 2px solid white; margin-left: -8px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-weight: 600; font-size: 10px; font-family: system-ui, sans-serif;">+5</div></div>' },
    { type: "progress", name: "Progress", icon: "📊", category: "ui", html: '<div style="width: 200px;"><div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span style="font-size: 12px; color: #374151; font-family: system-ui, sans-serif;">Progress</span><span style="font-size: 12px; color: #374151; font-family: system-ui, sans-serif;">75%</span></div><div style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;"><div style="width: 75%; height: 100%; background: #3b82f6; border-radius: 4px;"></div></div></div>' },
    { type: "divider", name: "Divider", icon: "➖", category: "ui", html: '<hr style="border: none; height: 1px; background: #e5e7eb; width: 200px; margin: 0;">' },
    { type: "icon-btn", name: "Icon Button", icon: "⚙️", category: "ui", html: '<button style="width: 40px; height: 40px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px;">⚙️</button>' },
    
    // Alerts & Notifications
    { type: "alert-info", name: "Info Alert", icon: "ℹ️", category: "alert", html: '<div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; width: 320px;"><span style="font-size: 18px;">ℹ️</span><div><p style="margin: 0 0 2px 0; font-size: 14px; font-weight: 600; color: #1e40af; font-family: system-ui, sans-serif;">Info</p><p style="margin: 0; font-size: 13px; color: #1e40af; font-family: system-ui, sans-serif;">This is an informational message.</p></div></div>' },
    { type: "alert-success", name: "Success Alert", icon: "✅", category: "alert", html: '<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; width: 320px;"><span style="font-size: 18px;">✅</span><div><p style="margin: 0 0 2px 0; font-size: 14px; font-weight: 600; color: #15803d; font-family: system-ui, sans-serif;">Success</p><p style="margin: 0; font-size: 13px; color: #15803d; font-family: system-ui, sans-serif;">Your changes have been saved.</p></div></div>' },
    { type: "alert-warning", name: "Warning Alert", icon: "⚠️", category: "alert", html: '<div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; width: 320px;"><span style="font-size: 18px;">⚠️</span><div><p style="margin: 0 0 2px 0; font-size: 14px; font-weight: 600; color: #a16207; font-family: system-ui, sans-serif;">Warning</p><p style="margin: 0; font-size: 13px; color: #a16207; font-family: system-ui, sans-serif;">Please review before continuing.</p></div></div>' },
    { type: "alert-error", name: "Error Alert", icon: "❌", category: "alert", html: '<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; width: 320px;"><span style="font-size: 18px;">❌</span><div><p style="margin: 0 0 2px 0; font-size: 14px; font-weight: 600; color: #b91c1c; font-family: system-ui, sans-serif;">Error</p><p style="margin: 0; font-size: 13px; color: #b91c1c; font-family: system-ui, sans-serif;">Something went wrong. Please try again.</p></div></div>' },
    
    // Navigation
    { type: "nav", name: "Nav Bar", icon: "🧭", category: "nav", html: '<nav style="background: white; padding: 12px 20px; border-radius: 8px; border: 1px solid #e5e7eb; display: flex; gap: 24px; align-items: center;"><span style="font-weight: 700; font-size: 16px; color: #111827; font-family: system-ui, sans-serif;">Logo</span><a href="#" style="color: #6b7280; text-decoration: none; font-size: 14px; font-weight: 500; font-family: system-ui, sans-serif;">Home</a><a href="#" style="color: #6b7280; text-decoration: none; font-size: 14px; font-weight: 500; font-family: system-ui, sans-serif;">Features</a><a href="#" style="color: #6b7280; text-decoration: none; font-size: 14px; font-weight: 500; font-family: system-ui, sans-serif;">Pricing</a><a href="#" style="color: #6b7280; text-decoration: none; font-size: 14px; font-weight: 500; font-family: system-ui, sans-serif;">About</a></nav>' },
    { type: "breadcrumb", name: "Breadcrumb", icon: "🍞", category: "nav", html: '<nav style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-family: system-ui, sans-serif;"><a href="#" style="color: #6b7280; text-decoration: none;">Home</a><span style="color: #9ca3af;">/</span><a href="#" style="color: #6b7280; text-decoration: none;">Products</a><span style="color: #9ca3af;">/</span><span style="color: #111827; font-weight: 500;">Details</span></nav>' },
    { type: "tabs", name: "Tabs", icon: "📑", category: "nav", html: '<div style="display: flex; border-bottom: 1px solid #e5e7eb;"><button style="padding: 10px 16px; background: white; border: none; border-bottom: 2px solid #3b82f6; color: #3b82f6; font-size: 14px; font-weight: 500; cursor: pointer; font-family: system-ui, sans-serif;">Tab 1</button><button style="padding: 10px 16px; background: white; border: none; border-bottom: 2px solid transparent; color: #6b7280; font-size: 14px; font-weight: 500; cursor: pointer; font-family: system-ui, sans-serif;">Tab 2</button><button style="padding: 10px 16px; background: white; border: none; border-bottom: 2px solid transparent; color: #6b7280; font-size: 14px; font-weight: 500; cursor: pointer; font-family: system-ui, sans-serif;">Tab 3</button></div>' },
    
    // Sections
    { type: "hero", name: "Hero Section", icon: "🦸", category: "section", html: '<div style="text-align: center; padding: 40px; max-width: 600px;"><h1 style="font-size: 36px; font-weight: 700; color: #111827; margin: 0 0 16px 0; line-height: 1.2; font-family: system-ui, sans-serif;">Build Something Amazing Today</h1><p style="font-size: 18px; color: #6b7280; margin: 0 0 24px 0; line-height: 1.6; font-family: system-ui, sans-serif;">Create beautiful, modern interfaces with our intuitive design tools.</p><div style="display: flex; gap: 12px; justify-content: center;"><button style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: system-ui, sans-serif;">Get Started</button><button style="padding: 12px 24px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: system-ui, sans-serif;">Learn More</button></div></div>' },
    { type: "feature-grid", name: "Features", icon: "✨", category: "section", html: '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 720px;"><div style="text-align: center; padding: 20px;"><div style="font-size: 32px; margin-bottom: 12px;">⚡</div><h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px 0; font-family: system-ui, sans-serif;">Fast Performance</h3><p style="font-size: 14px; color: #6b7280; margin: 0; font-family: system-ui, sans-serif;">Lightning-fast load times.</p></div><div style="text-align: center; padding: 20px;"><div style="font-size: 32px; margin-bottom: 12px;">🔒</div><h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px 0; font-family: system-ui, sans-serif;">Secure</h3><p style="font-size: 14px; color: #6b7280; margin: 0; font-family: system-ui, sans-serif;">Enterprise-grade security.</p></div><div style="text-align: center; padding: 20px;"><div style="font-size: 32px; margin-bottom: 12px;">🎨</div><h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px 0; font-family: system-ui, sans-serif;">Beautiful</h3><p style="font-size: 14px; color: #6b7280; margin: 0; font-family: system-ui, sans-serif;">Modern, clean design.</p></div></div>' },
    { type: "cta", name: "CTA Banner", icon: "📢", category: "section", html: '<div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px 40px; border-radius: 12px; text-align: center; width: 480px;"><h2 style="font-size: 24px; font-weight: 700; color: white; margin: 0 0 8px 0; font-family: system-ui, sans-serif;">Ready to get started?</h2><p style="font-size: 16px; color: rgba(255,255,255,0.9); margin: 0 0 20px 0; font-family: system-ui, sans-serif;">Join thousands of happy customers today.</p><button style="padding: 12px 28px; background: white; color: #3b82f6; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: system-ui, sans-serif;">Start Free Trial</button></div>' },
    { type: "footer", name: "Footer", icon: "🦶", category: "section", html: '<footer style="background: #111827; padding: 24px 32px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; min-width: 500px;"><span style="color: #9ca3af; font-size: 14px; font-family: system-ui, sans-serif;">© 2024 Company. All rights reserved.</span><div style="display: flex; gap: 20px;"><a href="#" style="color: #9ca3af; text-decoration: none; font-size: 14px; font-family: system-ui, sans-serif;">Privacy</a><a href="#" style="color: #9ca3af; text-decoration: none; font-size: 14px; font-family: system-ui, sans-serif;">Terms</a><a href="#" style="color: #9ca3af; text-decoration: none; font-size: 14px; font-family: system-ui, sans-serif;">Contact</a></div></footer>' },
    
    // Media
    { type: "image", name: "Image", icon: "🖼️", category: "media", html: '<div style="width: 240px; height: 160px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: 500; font-family: system-ui, sans-serif;">📷 Image</div>' },
    { type: "video", name: "Video", icon: "🎬", category: "media", html: '<div style="width: 320px; height: 180px; background: #111827; border-radius: 8px; display: flex; align-items: center; justify-content: center; position: relative;"><div style="width: 56px; height: 56px; background: rgba(255,255,255,0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">▶️</div></div>' },
    
    // Data Display
    { type: "stat", name: "Stat Card", icon: "📈", category: "data", html: '<div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; width: 180px;"><p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; font-weight: 500; font-family: system-ui, sans-serif;">Total Revenue</p><p style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #111827; font-family: system-ui, sans-serif;">$45,231</p><p style="margin: 0; font-size: 12px; color: #10b981; font-family: system-ui, sans-serif;">↑ 12% from last month</p></div>' },
    { type: "table", name: "Table", icon: "📊", category: "data", html: '<table style="border-collapse: collapse; width: 400px; font-family: system-ui, sans-serif;"><thead><tr><th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: 600; color: #6b7280;">Name</th><th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: 600; color: #6b7280;">Status</th><th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: 600; color: #6b7280;">Amount</th></tr></thead><tbody><tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827;">John Doe</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 9999px; font-size: 12px;">Active</span></td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827; text-align: right;">$250.00</td></tr><tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827;">Jane Smith</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><span style="background: #fef3c7; color: #a16207; padding: 2px 8px; border-radius: 9999px; font-size: 12px;">Pending</span></td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827; text-align: right;">$150.00</td></tr></tbody></table>' },
  ];

  const fontFamilies = [
    { name: "System", value: "system-ui, sans-serif" },
    { name: "Inter", value: "'Inter', sans-serif" },
    { name: "Roboto", value: "'Roboto', sans-serif" },
    { name: "Open Sans", value: "'Open Sans', sans-serif" },
    { name: "Poppins", value: "'Poppins', sans-serif" },
    { name: "Playfair", value: "'Playfair Display', serif" },
    { name: "Georgia", value: "Georgia, serif" },
    { name: "Mono", value: "'SF Mono', 'Monaco', monospace" },
  ];

  function createToolbar() {
    const toolbar = document.createElement("div");
    toolbar.id = "pm-prototyper-toolbar";
    toolbar.innerHTML = `
      <div class="pm-toolbar-header">
        <span class="pm-toolbar-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
          Prototyper
        </span>
        <div class="pm-toolbar-actions">
          <button class="pm-toolbar-btn" id="pm-toggle-visibility" title="Toggle">👁️</button>
          <button class="pm-toolbar-btn" id="pm-export" title="Export PNG">📷</button>
          <button class="pm-toolbar-btn" id="pm-save" title="Save">💾</button>
          <button class="pm-toolbar-btn" id="pm-minimize" title="Close">✕</button>
        </div>
      </div>
        <div class="pm-toolbar-tabs">
          <button class="pm-toolbar-tab active" data-tab="components">Components</button>
        <button class="pm-toolbar-tab" data-tab="ai">AI</button>
          <button class="pm-toolbar-tab" data-tab="style">Style</button>
          <button class="pm-toolbar-tab" data-tab="layers">Layers</button>
          <button class="pm-toolbar-tab" data-tab="canvas">Canvas</button>
        </div>
      <div class="pm-toolbar-content">
        <div class="pm-toolbar-panel active" id="pm-panel-components">
          <div class="pm-component-grid">
            ${componentLibrary.map(c => `
              <div class="pm-component-item" data-type="${c.type}" title="${c.name}">
                <span class="pm-component-icon">${c.icon}</span>
                ${c.name}
              </div>
            `).join("")}
          </div>
        </div>
        
        <div class="pm-toolbar-panel" id="pm-panel-ai">
          <div class="pm-ai-section">
            <textarea class="pm-ai-input" id="pm-ai-prompt" placeholder="Describe the component you want...&#10;&#10;Example: A pricing card with three tiers showing monthly prices"></textarea>
            <button class="pm-btn pm-btn-primary" id="pm-ai-generate">✨ Generate Component</button>
            <div id="pm-ai-status">Ready to generate</div>
          </div>
        </div>
        
        <div class="pm-toolbar-panel" id="pm-panel-style">
          <div id="pm-style-editor">
            <div class="pm-empty-state" id="pm-no-selection">
              <div class="pm-empty-state-icon">🎨</div>
              Select a component to edit
            </div>
            <div id="pm-style-controls" style="display: none;">
              <div class="pm-style-section">
                <div class="pm-style-section-title">Size & Position</div>
                <div class="pm-style-group">
                  <label class="pm-style-label">Width <span id="pm-width-value">auto</span></label>
                  <div class="pm-style-row">
                    <input type="number" class="pm-style-input" id="pm-style-width" placeholder="auto" min="10">
                    <button class="pm-style-reset-btn" id="pm-reset-width" title="Reset">↺</button>
                  </div>
                </div>
              <div class="pm-style-group">
                  <label class="pm-style-label">Height <span id="pm-height-value">auto</span></label>
                <div class="pm-style-row">
                    <input type="number" class="pm-style-input" id="pm-style-height" placeholder="auto" min="10">
                    <button class="pm-style-reset-btn" id="pm-reset-height" title="Reset">↺</button>
                  </div>
                </div>
              </div>
              
              <div class="pm-style-section">
                <div class="pm-style-section-title">Colors</div>
                <div class="pm-style-group">
                  <label class="pm-style-label">Background</label>
                  <div class="pm-style-row">
                    <input type="color" class="pm-color-input" id="pm-style-bg" value="#ffffff">
                  <input type="text" class="pm-style-input" id="pm-style-bg-text" placeholder="#ffffff">
                </div>
              </div>
              <div class="pm-style-group">
                  <label class="pm-style-label">Text Color</label>
                <div class="pm-style-row">
                    <input type="color" class="pm-color-input" id="pm-style-color" value="#000000">
                    <input type="text" class="pm-style-input" id="pm-style-color-text" placeholder="#000000">
                  </div>
                </div>
              </div>
              
              <div class="pm-style-section">
                <div class="pm-style-section-title">Typography</div>
                <div class="pm-style-group">
                  <label class="pm-style-label">Font Family</label>
                  <select class="pm-font-select" id="pm-style-font">
                    ${fontFamilies.map(f => `<option value="${f.value}">${f.name}</option>`).join("")}
                  </select>
              </div>
              <div class="pm-style-group">
                  <label class="pm-style-label">Font Size <span id="pm-fontsize-value">14px</span></label>
                  <input type="range" class="pm-style-slider" id="pm-style-fontsize" min="8" max="72" value="14">
              </div>
              <div class="pm-style-group">
                  <label class="pm-style-label">Font Weight <span id="pm-fontweight-value">400</span></label>
                  <input type="range" class="pm-style-slider" id="pm-style-fontweight" min="100" max="900" step="100" value="400">
                </div>
              </div>
              
              <div class="pm-style-section">
                <div class="pm-style-section-title">Spacing</div>
                <div class="pm-style-group">
                  <label class="pm-style-label">Padding <span id="pm-padding-value">0px</span></label>
                  <input type="range" class="pm-style-slider" id="pm-style-padding" min="0" max="60" value="0">
              </div>
              <div class="pm-style-group">
                  <label class="pm-style-label">Border Radius <span id="pm-radius-value">0px</span></label>
                  <input type="range" class="pm-style-slider" id="pm-style-radius" min="0" max="50" value="0">
                </div>
              </div>
              
              <div class="pm-style-section">
                <div class="pm-style-section-title">Effects</div>
              <div class="pm-style-group">
                  <label class="pm-style-label">Opacity <span id="pm-opacity-value">100%</span></label>
                  <input type="range" class="pm-style-slider" id="pm-style-opacity" min="0" max="100" value="100">
                </div>
              </div>
              
              <button class="pm-btn pm-btn-danger" id="pm-delete-component">🗑️ Delete Component</button>
            </div>
          </div>
        </div>
        
        <div class="pm-toolbar-panel" id="pm-panel-layers">
          <div class="pm-layer-list" id="pm-layer-list">
            <div class="pm-empty-state">
              <div class="pm-empty-state-icon">📦</div>
              No components yet
            </div>
          </div>
          <button class="pm-btn pm-btn-secondary" id="pm-clear-all" style="margin-top: 10px;">Clear All</button>
        </div>
        
        <div class="pm-toolbar-panel" id="pm-panel-canvas">
          <div class="pm-style-section">
            <div class="pm-style-section-title">Blank Canvas</div>
            <p style="font-size: 12px; color: #71717a; margin-bottom: 12px;">Create a clean page for prototyping from scratch.</p>
            <button class="pm-btn pm-btn-primary" id="pm-toggle-canvas">🎨 Toggle Blank Canvas</button>
          </div>
          
          <div class="pm-style-section">
            <div class="pm-style-section-title">Canvas Settings</div>
            <div class="pm-style-group">
              <label class="pm-style-label">Background Color</label>
              <div class="pm-style-row">
                <input type="color" class="pm-color-input" id="pm-canvas-bg" value="#ffffff">
                <input type="text" class="pm-style-input" id="pm-canvas-bg-text" value="#ffffff">
              </div>
            </div>
            <div class="pm-style-group">
              <label class="pm-style-label">Canvas Size</label>
              <select class="pm-font-select" id="pm-canvas-size">
                <option value="fullscreen">Fullscreen</option>
                <option value="desktop">Desktop (1440×900)</option>
                <option value="laptop">Laptop (1280×800)</option>
                <option value="tablet">Tablet (768×1024)</option>
                <option value="mobile">Mobile (375×812)</option>
              </select>
            </div>
          </div>
          
          <div class="pm-style-section">
            <div class="pm-style-section-title">Open Blank Page</div>
            <p style="font-size: 12px; color: #71717a; margin-bottom: 12px;">Open a new browser tab with a blank canvas page.</p>
            <button class="pm-btn pm-btn-secondary" id="pm-open-blank-page">📄 Open Blank Page</button>
          </div>
        </div>
      </div>
      <div class="pm-quick-actions">
        <button class="pm-quick-btn" id="pm-quick-undo" title="Undo">↩️ Undo</button>
        <button class="pm-quick-btn" id="pm-quick-duplicate" title="Duplicate">📋 Copy</button>
        <button class="pm-quick-btn" id="pm-quick-export" title="Export">📷 Export</button>
      </div>
    `;
    document.body.appendChild(toolbar);
    setupToolbarEvents(toolbar);
    return toolbar;
  }

  function setupToolbarEvents(toolbar) {
    // Draggable header
    const header = toolbar.querySelector(".pm-toolbar-header");
    header.addEventListener("mousedown", (e) => {
      if (e.target.closest(".pm-toolbar-btn")) return;
      isDraggingToolbar = true;
      toolbarOffset.x = e.clientX - toolbar.offsetLeft;
      toolbarOffset.y = e.clientY - toolbar.offsetTop;
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDraggingToolbar) return;
      toolbar.style.left = (e.clientX - toolbarOffset.x) + "px";
      toolbar.style.right = "auto";
      toolbar.style.top = (e.clientY - toolbarOffset.y) + "px";
    });

    document.addEventListener("mouseup", () => {
      isDraggingToolbar = false;
    });

    // Tabs
    toolbar.querySelectorAll(".pm-toolbar-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        toolbar.querySelectorAll(".pm-toolbar-tab").forEach(t => t.classList.remove("active"));
        toolbar.querySelectorAll(".pm-toolbar-panel").forEach(p => p.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(`pm-panel-${tab.dataset.tab}`).classList.add("active");
      });
    });

    // Components
    toolbar.querySelectorAll(".pm-component-item").forEach(item => {
      item.addEventListener("click", () => {
        addComponent(item.dataset.type, window.innerWidth / 2 - 100, window.innerHeight / 2 - 50);
      });
    });

    // Toolbar buttons
    document.getElementById("pm-minimize").addEventListener("click", () => {
      toolbar.classList.remove("visible");
      isToolbarVisible = false;
    });

    document.getElementById("pm-toggle-visibility").addEventListener("click", () => {
      const visibility = components.length > 0 && components[0].element.style.display !== "none";
      components.forEach(c => {
        c.element.style.display = visibility ? "none" : "block";
      });
    });

    document.getElementById("pm-export").addEventListener("click", exportAsPNG);
    document.getElementById("pm-quick-export").addEventListener("click", exportAsPNG);
    document.getElementById("pm-save").addEventListener("click", saveMockups);
    document.getElementById("pm-ai-generate").addEventListener("click", generateWithAI);
    document.getElementById("pm-clear-all").addEventListener("click", clearAllComponents);
    document.getElementById("pm-delete-component").addEventListener("click", deleteSelectedComponent);
    document.getElementById("pm-quick-duplicate").addEventListener("click", duplicateSelected);

    // Canvas controls
    document.getElementById("pm-toggle-canvas").addEventListener("click", toggleBlankCanvas);
    document.getElementById("pm-open-blank-page").addEventListener("click", openBlankPage);
    
    document.getElementById("pm-canvas-bg").addEventListener("input", (e) => {
      document.getElementById("pm-canvas-bg-text").value = e.target.value;
      updateCanvasBackground(e.target.value);
    });
    document.getElementById("pm-canvas-bg-text").addEventListener("change", (e) => {
      document.getElementById("pm-canvas-bg").value = e.target.value;
      updateCanvasBackground(e.target.value);
    });
    document.getElementById("pm-canvas-size").addEventListener("change", updateCanvasSize);

    setupStyleControls();
  }

  function setupStyleControls() {
    // Background color
    const bgColor = document.getElementById("pm-style-bg");
    const bgText = document.getElementById("pm-style-bg-text");
    bgColor.addEventListener("input", () => {
      bgText.value = bgColor.value;
      applyStyle("background", bgColor.value);
    });
    bgText.addEventListener("change", () => {
      bgColor.value = bgText.value;
      applyStyle("background", bgText.value);
    });

    // Text color
    const textColor = document.getElementById("pm-style-color");
    const textText = document.getElementById("pm-style-color-text");
    textColor.addEventListener("input", () => {
      textText.value = textColor.value;
      applyStyle("color", textColor.value);
    });
    textText.addEventListener("change", () => {
      textColor.value = textText.value;
      applyStyle("color", textText.value);
    });

    // Font family
    document.getElementById("pm-style-font").addEventListener("change", (e) => {
      applyStyle("fontFamily", e.target.value);
    });

    // Font size
    document.getElementById("pm-style-fontsize").addEventListener("input", (e) => {
      document.getElementById("pm-fontsize-value").textContent = e.target.value + "px";
      applyStyle("fontSize", e.target.value + "px");
    });

    // Font weight
    document.getElementById("pm-style-fontweight").addEventListener("input", (e) => {
      document.getElementById("pm-fontweight-value").textContent = e.target.value;
      applyStyle("fontWeight", e.target.value);
    });

    // Padding
    document.getElementById("pm-style-padding").addEventListener("input", (e) => {
      document.getElementById("pm-padding-value").textContent = e.target.value + "px";
      applyStyle("padding", e.target.value + "px");
    });

    // Border radius
    document.getElementById("pm-style-radius").addEventListener("input", (e) => {
      document.getElementById("pm-radius-value").textContent = e.target.value + "px";
      applyStyle("borderRadius", e.target.value + "px");
    });

    // Opacity
    document.getElementById("pm-style-opacity").addEventListener("input", (e) => {
      document.getElementById("pm-opacity-value").textContent = e.target.value + "%";
      if (selectedComponent) {
        selectedComponent.element.style.opacity = e.target.value / 100;
      }
    });

    // Width
    document.getElementById("pm-style-width").addEventListener("input", (e) => {
      if (selectedComponent && e.target.value) {
        document.getElementById("pm-width-value").textContent = e.target.value + "px";
        selectedComponent.element.style.setProperty("width", e.target.value + "px", "important");
        // Also resize first child
        const firstChild = selectedComponent.element.querySelector(":scope > *:not(.pm-resize-handle)");
        if (firstChild) {
          firstChild.style.setProperty("width", e.target.value + "px", "important");
        }
      }
    });

    // Height
    document.getElementById("pm-style-height").addEventListener("input", (e) => {
      if (selectedComponent && e.target.value) {
        document.getElementById("pm-height-value").textContent = e.target.value + "px";
        selectedComponent.element.style.setProperty("height", e.target.value + "px", "important");
        // Also resize first child
        const firstChild = selectedComponent.element.querySelector(":scope > *:not(.pm-resize-handle)");
        if (firstChild) {
          firstChild.style.setProperty("height", e.target.value + "px", "important");
        }
      }
    });

    // Reset buttons
    document.getElementById("pm-reset-width").addEventListener("click", () => {
      if (selectedComponent) {
        selectedComponent.element.style.width = "";
        const firstChild = selectedComponent.element.querySelector(":scope > *:not(.pm-resize-handle)");
        if (firstChild) firstChild.style.width = "";
        document.getElementById("pm-style-width").value = "";
        document.getElementById("pm-width-value").textContent = "auto";
      }
    });

    document.getElementById("pm-reset-height").addEventListener("click", () => {
      if (selectedComponent) {
        selectedComponent.element.style.height = "";
        const firstChild = selectedComponent.element.querySelector(":scope > *:not(.pm-resize-handle)");
        if (firstChild) firstChild.style.height = "";
        document.getElementById("pm-style-height").value = "";
        document.getElementById("pm-height-value").textContent = "auto";
      }
    });
  }

  function applyStyle(property, value) {
    if (!selectedComponent) return;

    // Convert camelCase to kebab-case
    const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();

    // Apply to wrapper
    selectedComponent.element.style.setProperty(cssProperty, value, "important");

    // Apply to all children (except resize handles)
    const children = selectedComponent.element.querySelectorAll("*:not(.pm-resize-handle)");
      children.forEach(child => {
      child.style.setProperty(cssProperty, value, "important");
      });
  }

  function addComponent(type, x, y, customHtml = null) {
    const componentDef = componentLibrary.find(c => c.type === type) || { 
      type: "custom", name: "Custom", icon: "📦", html: customHtml || "<div>Custom</div>" 
    };
    const html = customHtml || componentDef.html;

    const wrapper = document.createElement("div");
    wrapper.className = "pm-overlay-component";
    wrapper.style.position = "fixed";
    wrapper.style.left = x + "px";
    wrapper.style.top = y + "px";
    wrapper.innerHTML = html + `
      <div class="pm-resize-handle nw"></div>
      <div class="pm-resize-handle n"></div>
      <div class="pm-resize-handle ne"></div>
      <div class="pm-resize-handle e"></div>
      <div class="pm-resize-handle se"></div>
      <div class="pm-resize-handle s"></div>
      <div class="pm-resize-handle sw"></div>
      <div class="pm-resize-handle w"></div>
    `;

    // Add to DOM first to get dimensions
    document.body.appendChild(wrapper);
    
    // Get the natural dimensions and set them explicitly with !important
    const rect = wrapper.getBoundingClientRect();
    wrapper.style.setProperty("width", rect.width + "px", "important");
    wrapper.style.setProperty("height", rect.height + "px", "important");
    
    // Also set on first child for consistent resizing
    const firstChild = wrapper.querySelector(":scope > *:not(.pm-resize-handle)");
    if (firstChild) {
      firstChild.style.setProperty("width", rect.width + "px", "important");
      firstChild.style.setProperty("height", rect.height + "px", "important");
      firstChild.style.setProperty("box-sizing", "border-box", "important");
    }

    const id = componentIdCounter++;
    const component = {
      id,
      type: componentDef.type,
      name: componentDef.name || "Custom",
      icon: componentDef.icon || "📦",
      element: wrapper,
      x,
      y,
    };

    components.push(component);
    setupComponentDrag(wrapper, component);
    setupComponentResize(wrapper);
    
    wrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      selectComponent(component);
    });

    wrapper.addEventListener("dblclick", (e) => {
      const target = e.target;
      if (["P", "H1", "H2", "H3", "H4", "SPAN", "A", "BUTTON", "LI", "TD", "TH", "LABEL"].includes(target.tagName)) {
        target.contentEditable = true;
        target.focus();
        target.addEventListener("blur", () => {
          target.contentEditable = false;
        }, { once: true });
      }
    });

    updateLayerList();
    selectComponent(component);
    showToast(`✓ Added ${componentDef.name}`);
  }

  function setupComponentDrag(element, component) {
    element.onmousedown = function(e) {
      // Don't drag if clicking on resize handle
      if (e.target.classList.contains("pm-resize-handle")) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      const startX = e.clientX;
      const startY = e.clientY;
      const origLeft = parseInt(element.style.left) || 0;
      const origTop = parseInt(element.style.top) || 0;

      function handleMouseMove(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
        element.style.setProperty("left", (origLeft + dx) + "px", "important");
        element.style.setProperty("top", (origTop + dy) + "px", "important");
        component.x = origLeft + dx;
        component.y = origTop + dy;
      }

      function handleMouseUp() {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      }

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };
  }

  function setupComponentResize(element) {
    const handles = element.querySelectorAll(".pm-resize-handle");
    
    handles.forEach(handle => {
      const classes = handle.className.split(" ");
      const direction = classes[classes.length - 1];

      handle.onmousedown = function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        console.log("[PM] Resize started, direction:", direction);
        
        // Get current dimensions
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = element.offsetWidth;
        const startH = element.offsetHeight;
        const startLeft = parseInt(element.style.left) || 0;
        const startTop = parseInt(element.style.top) || 0;

        console.log("[PM] Start dims:", { startW, startH, startLeft, startTop });

        function handleMouseMove(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

          let newW = startW;
          let newH = startH;
          let newLeft = startLeft;
          let newTop = startTop;

          // East
        if (direction.includes("e")) {
            newW = Math.max(50, startW + dx);
        }
          // West
        if (direction.includes("w")) {
            newW = Math.max(50, startW - dx);
            newLeft = startLeft + dx;
        }
          // South
        if (direction.includes("s")) {
            newH = Math.max(30, startH + dy);
          }
          // North
          if (direction.includes("n")) {
            newH = Math.max(30, startH - dy);
            newTop = startTop + dy;
          }

          // Apply to wrapper
          element.style.setProperty("width", newW + "px", "important");
          element.style.setProperty("height", newH + "px", "important");
          element.style.setProperty("left", newLeft + "px", "important");
          element.style.setProperty("top", newTop + "px", "important");
          
          // Also apply to first child (the actual component content)
          const firstChild = element.querySelector(":scope > *:not(.pm-resize-handle)");
          if (firstChild) {
            firstChild.style.setProperty("width", newW + "px", "important");
            firstChild.style.setProperty("height", newH + "px", "important");
          }
        }

        function handleMouseUp() {
          console.log("[PM] Resize ended");
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          syncStyleControls();
        }

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      };
    });
  }

  function selectComponent(component) {
    components.forEach(c => c.element.classList.remove("selected"));
    if (component) {
      component.element.classList.add("selected");
      selectedComponent = component;
      document.getElementById("pm-no-selection").style.display = "none";
      document.getElementById("pm-style-controls").style.display = "block";
      syncStyleControls();
    } else {
      selectedComponent = null;
      document.getElementById("pm-no-selection").style.display = "block";
      document.getElementById("pm-style-controls").style.display = "none";
    }
    updateLayerList();
  }

  function syncStyleControls() {
    if (!selectedComponent) return;

    const el = selectedComponent.element;
    const firstChild = el.querySelector(":not(.pm-resize-handle)");
    const target = firstChild || el;
    const styles = window.getComputedStyle(target);
    const wrapperStyles = window.getComputedStyle(el);

    // Width & Height
    const w = parseInt(wrapperStyles.width);
    const h = parseInt(wrapperStyles.height);
    document.getElementById("pm-style-width").value = w || "";
    document.getElementById("pm-style-height").value = h || "";
    document.getElementById("pm-width-value").textContent = w ? w + "px" : "auto";
    document.getElementById("pm-height-value").textContent = h ? h + "px" : "auto";

    // Background
    let bg = rgbToHex(styles.backgroundColor);
    if (bg) {
      document.getElementById("pm-style-bg").value = bg;
      document.getElementById("pm-style-bg-text").value = bg;
    }

    // Text color
    const color = rgbToHex(styles.color);
    if (color) {
      document.getElementById("pm-style-color").value = color;
      document.getElementById("pm-style-color-text").value = color;
    }

    // Font size
    const fontSize = parseInt(styles.fontSize) || 14;
    document.getElementById("pm-style-fontsize").value = fontSize;
    document.getElementById("pm-fontsize-value").textContent = fontSize + "px";

    // Font weight
    const fontWeight = parseInt(styles.fontWeight) || 400;
    document.getElementById("pm-style-fontweight").value = fontWeight;
    document.getElementById("pm-fontweight-value").textContent = fontWeight;

    // Padding
    const padding = parseInt(styles.padding) || 0;
    document.getElementById("pm-style-padding").value = Math.min(padding, 60);
    document.getElementById("pm-padding-value").textContent = padding + "px";

    // Border radius
    const radius = parseInt(styles.borderRadius) || 0;
    document.getElementById("pm-style-radius").value = Math.min(radius, 50);
    document.getElementById("pm-radius-value").textContent = radius + "px";

    // Opacity
    const opacity = parseFloat(wrapperStyles.opacity) || 1;
    document.getElementById("pm-style-opacity").value = Math.round(opacity * 100);
    document.getElementById("pm-opacity-value").textContent = Math.round(opacity * 100) + "%";
  }

  function rgbToHex(rgb) {
    if (!rgb) return "#ffffff";
    const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return rgb.startsWith("#") ? rgb : "#ffffff";
    return "#" + [1, 2, 3].map(i => {
      const hex = parseInt(match[i]).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }

  function deleteSelectedComponent() {
    if (!selectedComponent) return;
    selectedComponent.element.remove();
    components = components.filter(c => c.id !== selectedComponent.id);
    selectComponent(null);
    updateLayerList();
    showToast("🗑️ Component deleted");
  }

  function clearAllComponents() {
    components.forEach(c => c.element.remove());
    components = [];
    componentIdCounter = 0;
    selectComponent(null);
    updateLayerList();
    showToast("🧹 All cleared");
  }

  // ===== Blank Canvas Functions =====
  let blankCanvasVisible = false;
  let blankCanvas = null;

  function createBlankCanvas() {
    if (blankCanvas) return blankCanvas;
    
    blankCanvas = document.createElement("div");
    blankCanvas.id = "pm-blank-canvas";
    blankCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #ffffff;
      z-index: 9999;
      display: none;
    `;
    document.body.appendChild(blankCanvas);
    return blankCanvas;
  }

  function toggleBlankCanvas() {
    const canvas = createBlankCanvas();
    blankCanvasVisible = !blankCanvasVisible;
    canvas.style.display = blankCanvasVisible ? "block" : "none";
    
    const btn = document.getElementById("pm-toggle-canvas");
    btn.textContent = blankCanvasVisible ? "🔙 Hide Canvas" : "🎨 Toggle Blank Canvas";
    
    showToast(blankCanvasVisible ? "🎨 Canvas enabled" : "🔙 Canvas hidden");
  }

  function updateCanvasBackground(color) {
    const canvas = createBlankCanvas();
    canvas.style.background = color;
  }

  function updateCanvasSize() {
    const canvas = createBlankCanvas();
    const size = document.getElementById("pm-canvas-size").value;
    
    const sizes = {
      fullscreen: { width: "100vw", height: "100vh", top: "0", left: "0" },
      desktop: { width: "1440px", height: "900px", top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
      laptop: { width: "1280px", height: "800px", top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
      tablet: { width: "768px", height: "1024px", top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
      mobile: { width: "375px", height: "812px", top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
    };
    
    const s = sizes[size] || sizes.fullscreen;
    canvas.style.width = s.width;
    canvas.style.height = s.height;
    canvas.style.top = s.top;
    canvas.style.left = s.left;
    canvas.style.transform = s.transform || "none";
    canvas.style.boxShadow = size !== "fullscreen" ? "0 25px 50px -12px rgba(0,0,0,0.25)" : "none";
    canvas.style.borderRadius = size !== "fullscreen" ? "12px" : "0";
  }

  function openBlankPage() {
    const bgColor = document.getElementById("pm-canvas-bg").value || "#ffffff";
    const size = document.getElementById("pm-canvas-size").value || "fullscreen";
    
    // Open the extension's canvas page with settings as query params
    const canvasUrl = chrome.runtime.getURL("canvas.html");
    const params = new URLSearchParams({ bg: bgColor, size: size });
    window.open(`${canvasUrl}?${params}`, "_blank");
    showToast("📄 Blank canvas opened in new tab!");
  }

  function duplicateSelected() {
    if (!selectedComponent) {
      showToast("Select a component first");
      return;
    }
    const html = selectedComponent.element.innerHTML.replace(/<div class="pm-resize-handle[^>]*><\/div>/g, "");
    addComponent(selectedComponent.type, selectedComponent.x + 20, selectedComponent.y + 20, html);
    showToast("📋 Duplicated");
  }

  function updateLayerList() {
    const list = document.getElementById("pm-layer-list");
    if (components.length === 0) {
      list.innerHTML = '<div class="pm-empty-state"><div class="pm-empty-state-icon">📦</div>No components yet</div>';
      return;
    }

    list.innerHTML = components.map(c => `
      <div class="pm-layer-item ${selectedComponent?.id === c.id ? "selected" : ""}" data-id="${c.id}">
        <span class="pm-layer-icon">${c.icon}</span>
        <span class="pm-layer-name">${c.name}</span>
        <div class="pm-layer-actions">
          <button class="pm-layer-btn" data-action="delete" title="Delete">🗑️</button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll(".pm-layer-item").forEach(item => {
      item.addEventListener("click", (e) => {
        if (e.target.dataset.action === "delete") {
          const id = parseInt(item.dataset.id);
          const comp = components.find(c => c.id === id);
          if (comp) {
            comp.element.remove();
            components = components.filter(c => c.id !== id);
            if (selectedComponent?.id === id) selectComponent(null);
            updateLayerList();
          }
        } else {
          const id = parseInt(item.dataset.id);
          const comp = components.find(c => c.id === id);
          if (comp) selectComponent(comp);
        }
      });
    });
  }

  async function generateWithAI() {
    const prompt = document.getElementById("pm-ai-prompt").value.trim();
    const statusEl = document.getElementById("pm-ai-status");
    const btn = document.getElementById("pm-ai-generate");

    if (!prompt) {
      statusEl.textContent = "⚠️ Enter a description";
      return;
    }

    btn.disabled = true;
    statusEl.textContent = "⏳ Generating...";

    try {
      const response = await fetch(`${apiUrl}/api/generate-component`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context: document.title }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const data = await response.json();
      if (data.html) {
        if (data.css) {
          const styleEl = document.createElement("style");
          styleEl.textContent = data.css;
          document.head.appendChild(styleEl);
        }
        addComponent("custom", window.innerWidth / 2 - 150, window.innerHeight / 2 - 100, data.html);
        statusEl.textContent = "✨ Generated!";
        document.getElementById("pm-ai-prompt").value = "";
      } else {
        statusEl.textContent = "❌ No output";
      }
    } catch (error) {
      statusEl.textContent = "❌ " + error.message;
    } finally {
      btn.disabled = false;
    }
  }

  function saveMockups() {
    const domain = window.location.hostname;
    const mockupData = components.map(c => ({
      type: c.type,
      name: c.name,
      icon: c.icon,
      x: c.element.offsetLeft,
      y: c.element.offsetTop,
      width: c.element.offsetWidth,
      height: c.element.offsetHeight,
      html: c.element.innerHTML.replace(/<div class="pm-resize-handle[^>]*><\/div>/g, ""),
    }));

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const mockups = stored ? JSON.parse(stored) : {};
      mockups[domain] = mockupData;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockups));
      showToast(`💾 Saved ${mockupData.length} items`);
    } catch (error) {
      showToast("❌ Save failed");
    }
  }

  function loadMockups() {
    const domain = window.location.hostname;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const mockups = stored ? JSON.parse(stored) : {};
      const domainMockups = mockups[domain];

      if (!domainMockups || domainMockups.length === 0) {
        showToast("ℹ️ No saved mockups");
        return;
      }

      clearAllComponents();
      domainMockups.forEach(m => {
        addComponent(m.type, m.x, m.y, m.html);
        const lastComp = components[components.length - 1];
        if (m.width) lastComp.element.style.width = m.width + "px";
        if (m.height) lastComp.element.style.height = m.height + "px";
      });
      showToast(`📂 Loaded ${domainMockups.length} items`);
    } catch (error) {
      showToast("❌ Load failed");
    }
  }

  async function exportAsPNG() {
    const toolbar = document.getElementById("pm-prototyper-toolbar");
    toolbar.style.display = "none";
    components.forEach(c => c.element.classList.remove("selected"));

    // Store original positions and convert fixed to absolute for capture
    const originalPositions = [];
    components.forEach(c => {
      const rect = c.element.getBoundingClientRect();
      originalPositions.push({
        element: c.element,
        position: c.element.style.position,
        left: c.element.style.left,
        top: c.element.style.top,
      });
      // Convert to absolute position relative to document
      c.element.style.position = "absolute";
      c.element.style.left = (rect.left + window.scrollX) + "px";
      c.element.style.top = (rect.top + window.scrollY) + "px";
    });

    await new Promise(r => setTimeout(r, 200));

    try {
      if (typeof html2canvas === "undefined") {
        throw new Error("html2canvas not loaded");
      }

      const canvas = await html2canvas(document.documentElement, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      });

        const link = document.createElement("a");
        link.download = `mockup-${window.location.hostname}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
        link.click();
      showToast("📷 PNG exported!");
    } catch (error) {
      console.error("Export error:", error);
      // Fallback to HTML export
      const html = document.documentElement.outerHTML;
      const blob = new Blob([html], { type: "text/html" });
      const link = document.createElement("a");
      link.download = `mockup-${window.location.hostname}-${Date.now()}.html`;
      link.href = URL.createObjectURL(blob);
      link.click();
      showToast("📄 Exported as HTML (PNG failed)");
    } finally {
      // Restore original positions
      originalPositions.forEach(p => {
        p.element.style.position = p.position || "fixed";
        p.element.style.left = p.left;
        p.element.style.top = p.top;
      });
      toolbar.style.display = "";
      toolbar.classList.add("visible");
    }
  }

  function showToast(message) {
    const existing = document.querySelector(".pm-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "pm-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "pm-toast-out 0.2s ease-in forwards";
      setTimeout(() => toast.remove(), 200);
    }, 2000);
  }

  function init() {
    createToolbar();

    document.addEventListener("click", (e) => {
      if (!e.target.closest("#pm-prototyper-toolbar") && !e.target.closest(".pm-overlay-component")) {
        selectComponent(null);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedComponent && !document.activeElement.matches("input, textarea, [contenteditable]")) {
          deleteSelectedComponent();
        }
      }
    });

    // Listen for messages from popup via chrome.runtime
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "PM_TOGGLE_TOOLBAR") {
        if (message.apiUrl) {
          apiUrl = message.apiUrl;
        }
        const toolbar = document.getElementById("pm-prototyper-toolbar");
        if (toolbar) {
          toolbar.classList.toggle("visible");
          isToolbarVisible = toolbar.classList.contains("visible");
        }
        sendResponse({ success: true });
      } else if (message.type === "PM_LOAD_MOCKUPS") {
        loadMockups();
        sendResponse({ success: true });
      }
      return true;
    });

    // Also listen for window messages (fallback)
    window.addEventListener("message", (e) => {
      if (e.source !== window) return;
      if (e.data.type === "PM_PROTOTYPER_TOGGLE_TOOLBAR") {
        const toolbar = document.getElementById("pm-prototyper-toolbar");
        if (toolbar) {
        toolbar.classList.toggle("visible");
        isToolbarVisible = toolbar.classList.contains("visible");
        }
      } else if (e.data.type === "PM_PROTOTYPER_LOAD_MOCKUPS") {
        loadMockups();
      } else if (e.data.type === "PM_PROTOTYPER_SET_API_URL") {
        apiUrl = e.data.url || "http://localhost:3001";
      }
    });
  }

  init();
})();

