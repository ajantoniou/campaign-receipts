<!--
Purpose: Ready-to-paste ESP draft (HTML + plaintext) for the 5-email welcome flow
requested in CON-74. Each section includes subject variants, preview text, CTA, and
duplicate copies for Mailchimp/Resend (HTML + text).
-->

# Welcome Sequence - ESP Draft (Concise)

## Email 1 - Day 0: Thank you + first chapter download
**Subject lines:**  
- Thanks for joining Concise - your first chapter is ready  
- Your free MCAT preview is waiting  
**Preview text:** Download the first 27 pages of the MCAT Prep Guide V2 and start building momentum before test day.
**Goal:** Deliver the lead-magnet PDF, reinforce that this is distilled by a board-certified MD, and make the download obvious.

### HTML
```html
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: Inter, Arial, sans-serif; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse; }
    .header { background-color: #1a2a4d; padding: 16px 20px; text-align: center; }
    .header img { height: 48px; }
    .body { padding: 40px 20px; color: #2c3e50; }
    .body h1 { font-size: 24px; margin-bottom: 16px; color: #1a2a4d; }
    .body p { margin-bottom: 16px; line-height: 1.6; }
    .cta-section { background-color: #f5f5f5; padding: 32px 20px; text-align: center; }
    .cta-button {
      display: inline-block;
      background-color: #1a2a4d;
      color: #ffffff;
      border: 2px solid #00d9ff;
      padding: 16px 32px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .footer { padding: 20px; background-color: #f5f5f5; text-align: center; font-size: 11pt; color: #2c3e50; }
    .footer a { color: #1a2a4d; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .body { padding: 20px; }
      .cta-section { padding: 24px 16px; }
      .cta-button { width: 100%; box-sizing: border-box; }
    }
  </style>
</head>
<body>
<table class="email-container" width="600" cellpadding="0" cellspacing="0">
  <tr>
    <td class="header">
      <img src="https://concise.onrender.com/assets/logo-concise-white.svg" alt="Concise">
    </td>
  </tr>
  <tr>
    <td class="body">
      <h1>Hey {{first_name|default:"reader"}}, thanks for joining Concise.</h1>
      <p>We distilled a board-certified MD's notes into a 27-page sprint so you can feel confident before you even book the next practice exam. Download the first chapter of the MCAT Prep Guide V2 right now and see how tight, actionable clarity feels.</p>
      <p>Inside you will find:</p>
      <ul>
        <li>A single-page plan for splitting content into 30-minute sessions.</li>
        <li>High-leverage passages that explain how to frame every science passage.</li>
        <li>A checklist of what to practice before the next study block.</li>
      </ul>
      <p>It is the same prep we handed to the first batch of subscribers while keeping everything faceless and focused on real knowledge.</p>
    </td>
  </tr>
  <tr>
    <td class="cta-section">
      <a class="cta-button" href="https://concise.onrender.com/downloads/mcat-first-chapter">Download the first chapter</a>
    </td>
  </tr>
  <tr>
    <td class="footer">
      <p>(c) 2026 Concise. All rights reserved.</p>
      <p><a href="https://concise.onrender.com/privacy">Privacy Policy</a> | <a href="https://concise.onrender.com/terms">Terms</a> | <a href="[unsubscribe-link]">Unsubscribe</a></p>
    </td>
  </tr>
</table>
</body>
</html>
```

### Plain text

Subject: Thanks for joining Concise - your first chapter is ready  
Preview: Download the first 27 pages of the MCAT Prep Guide V2 and start building momentum before test day.  

```
Hi {{first_name|default:"friend"}},

Thanks for joining Concise. The first 27 pages of the MCAT Prep Guide V2 are ready for download:
https://concise.onrender.com/downloads/mcat-first-chapter

What you get today:
- A 30-minute sprint plan for science passages.
- The high-leverage focus that shapes every study block.
- A quick checklist for the next practice session.

Enjoy the chapter. Reply to this thread if you have questions.

Concise | https://concise.onrender.com | Unsubscribe: [unsubscribe-link]
```

## Email 2 - Day 1: Why this topic matters
**Subject lines:**  
- Why this MCAT method matters before you schedule test day  
- The story behind our concisely framed MCAT playbook  
**Preview text:** Three study truths from a former test-writer, plus the next excerpt to keep going.
**Goal:** Explain the framework behind the first chapter, show that Concise is mission-driven, and invite them to read the next section.

### HTML
```html
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: Inter, Arial, sans-serif; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse; }
    .header { background-color: #1a2a4d; padding: 16px 20px; text-align: center; }
    .header img { height: 48px; }
    .body { padding: 40px 20px; color: #2c3e50; }
    .body h1 { font-size: 24px; margin-bottom: 16px; color: #1a2a4d; }
    .body p { margin-bottom: 16px; line-height: 1.6; }
    .body blockquote { margin: 0 0 16px 0; padding-left: 12px; border-left: 4px solid #00d9ff; color: #1a2a4d; }
    .cta-section { background-color: #f5f5f5; padding: 32px 20px; text-align: center; }
    .cta-button {
      display: inline-block;
      background-color: #1a2a4d;
      color: #ffffff;
      border: 2px solid #00d9ff;
      padding: 16px 32px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .footer { padding: 20px; background-color: #f5f5f5; text-align: center; font-size: 11pt; color: #2c3e50; }
    .footer a { color: #1a2a4d; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .body { padding: 20px; }
      .cta-section { padding: 24px 16px; }
      .cta-button { width: 100%; box-sizing: border-box; }
    }
  </style>
</head>
<body>
<table class="email-container" width="600" cellpadding="0" cellspacing="0">
  <tr>
    <td class="header">
      <img src="https://concise.onrender.com/assets/logo-concise-white.svg" alt="Concise">
    </td>
  </tr>
  <tr>
    <td class="body">
      <h1>The MCAT doesn't need more textbooks; it needs sharper moves.</h1>
      <p>The first chapter was written with one question in mind: if you only had five minutes before a study block, what would actually move your score? The answer: a trio of simple habits that keep you moving forward instead of burning time on outlines.</p>
      <blockquote>
        "Focus on one passage at a time, learn the core evidence chain, and test with three rapid drills. Do that for 12 days and you already outpace most crammed sessions." - The Concise editorial team
      </blockquote>
      <p>The next excerpt (pages 28-42) expands on those habits with sample questions, proven timing cues, and a mini checklist for every study session.</p>
    </td>
  </tr>
  <tr>
    <td class="cta-section">
      <a class="cta-button" href="https://concise.onrender.com/books/mcat-prep-guide">Read the next excerpt</a>
    </td>
  </tr>
  <tr>
    <td class="footer">
      <p>(c) 2026 Concise. All rights reserved.</p>
      <p><a href="https://concise.onrender.com/privacy">Privacy Policy</a> | <a href="https://concise.onrender.com/terms">Terms</a> | <a href="[unsubscribe-link]">Unsubscribe</a></p>
    </td>
  </tr>
</table>
</body>
</html>
```

### Plain text

Subject: Why this MCAT method matters before you schedule test day  
Preview: Three study truths from a former test-writer, plus the next excerpt to keep going.  

```
Hi {{first_name|default:"friend"}},

The first chapter focuses on the question: what can you do right now that still moves your score forward?

Three habits we highlighted:
1. Attack one science passage, not the whole section. Track evidence chains, not facts.
2. Use the next 10 minutes to force yourself to explain the answer out loud.
3. End each block with a three-question drill so practice never feels like guesswork.

Read pages 28-42 for the drills, timing cues, and a three-line checklist for every study session:
https://concise.onrender.com/books/mcat-prep-guide

Concise | https://concise.onrender.com | Unsubscribe: [unsubscribe-link]
```

## Email 3 - Day 2: Cross-sell Consulting Frameworks
**Subject lines:**  
- If you loved the first chapter, try this consulting mindset  
- How consulting frameworks and MCAT prep think alike  
**Preview text:** Clear thinking is the shared muscle; here is the companion business playbook.  
**Goal:** Introduce `Consulting Frameworks` as the next logical buy for precision readers.

### HTML
```html
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: Inter, Arial, sans-serif; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse; }
    .header { background-color: #1a2a4d; padding: 16px 20px; text-align: center; }
    .header img { height: 48px; }
    .body { padding: 40px 20px; color: #2c3e50; }
    .body h1 { font-size: 24px; margin-bottom: 16px; color: #1a2a4d; }
    .body p { margin-bottom: 16px; line-height: 1.6; }
    .body table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .body td { padding: 8px 0; border-top: 1px solid #e0e0e0; }
    .body td:first-child { width: 80px; font-weight: bold; color: #1a2a4d; }
    .cta-section { background-color: #f5f5f5; padding: 32px 20px; text-align: center; }
    .cta-button {
      display: inline-block;
      background-color: #1a2a4d;
      color: #ffffff;
      border: 2px solid #00d9ff;
      padding: 16px 32px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .footer { padding: 20px; background-color: #f5f5f5; text-align: center; font-size: 11pt; color: #2c3e50; }
    .footer a { color: #1a2a4d; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .body { padding: 20px; }
      .cta-section { padding: 24px 16px; }
      .cta-button { width: 100%; box-sizing: border-box; }
    }
  </style>
</head>
<body>
<table class="email-container" width="600" cellpadding="0" cellspacing="0">
  <tr>
    <td class="header">
      <img src="https://concise.onrender.com/assets/logo-concise-white.svg" alt="Concise">
    </td>
  </tr>
  <tr>
    <td class="body">
      <h1>Build sharper decisions beyond the MCAT.</h1>
      <p>The same clarity you saw in that first chapter is why we packaged the Consulting Frameworks playbook for people who love structure. Each module centers on one question: what evidence matters, and how do you make the call with confidence?</p>
      <table>
        <tr><td>Module</td><td>Focus</td></tr>
        <tr><td>1</td><td>Reframe complex problems in 3 steps.</td></tr>
        <tr><td>2</td><td>Map choices to a decision tree you can explain out loud.</td></tr>
        <tr><td>3</td><td>Practice mental math fast enough to preview outcomes.</td></tr>
      </table>
      <p>This quick-reference guide was built with MBA students and high-intent professionals in mind-no fluff, just the same precision you expect from Concise.</p>
    </td>
  </tr>
  <tr>
    <td class="cta-section">
      <a class="cta-button" href="https://concise.onrender.com/books/consulting-frameworks">See Consulting Frameworks</a>
    </td>
  </tr>
  <tr>
    <td class="footer">
      <p>(c) 2026 Concise. All rights reserved.</p>
      <p><a href="https://concise.onrender.com/privacy">Privacy Policy</a> | <a href="https://concise.onrender.com/terms">Terms</a> | <a href="[unsubscribe-link]">Unsubscribe</a></p>
    </td>
  </tr>
</table>
</body>
</html>
```

### Plain text

Subject: If you loved the first chapter, try this consulting mindset  
Preview: Clear thinking is the shared muscle; here is the companion business playbook.  

```
Hi {{first_name|default:"friend"}},

One reason readers love the first chapter? We picked one question per section and answered it in 3-4 sentences. Consulting Frameworks does the same for real-world decisions.

Highlights:
- Module 1: Reframe a problem in three steps so the answer never feels "vague."
- Module 2: Build a decision tree you can explain to your study buddy or teammate.
- Module 3: Run through a 90-second mental drill to preview outcomes.

Ready to map that same precision onto business strategy?
https://concise.onrender.com/books/consulting-frameworks

Concise | https://concise.onrender.com | Unsubscribe: [unsubscribe-link]
```

## Email 4 - Day 3: Medical Exam Mastery bundle
**Subject lines:**  
- Medical Exam Mastery bundle - $49 for both MCAT & Nuclear Med  
- Bundle your exam prep and save $10  
**Preview text:** Combine MCAT Prep Guide V2 and the Nuclear Medicine review for a $10 savings.  
**Goal:** Promote the bundle (MCAT + Nuclear Medicine) with a savings message.

### HTML
```html
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: Inter, Arial, sans-serif; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse; }
    .header { background-color: #1a2a4d; padding: 16px 20px; text-align: center; }
    .header img { height: 48px; }
    .body { padding: 40px 20px; color: #2c3e50; }
    .body h1 { font-size: 24px; margin-bottom: 16px; color: #1a2a4d; }
    .body p { margin-bottom: 16px; line-height: 1.6; }
    .bundle-card { border: 1px solid #e0e0e0; padding: 16px; border-radius: 8px; background-color: #fdfdfd; margin-bottom: 16px; }
    .bundle-card h2 { margin: 0 0 8px 0; font-size: 18px; color: #1a2a4d; }
    .bundle-card ul { margin: 0; padding-left: 20px; }
    .bundle-card li { margin-bottom: 6px; }
    .price { font-size: 20px; font-weight: bold; }
    .cta-section { background-color: #f5f5f5; padding: 32px 20px; text-align: center; }
    .cta-button {
      display: inline-block;
      background-color: #1a2a4d;
      color: #ffffff;
      border: 2px solid #00d9ff;
      padding: 16px 32px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .footer { padding: 20px; background-color: #f5f5f5; text-align: center; font-size: 11pt; color: #2c3e50; }
    .footer a { color: #1a2a4d; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .body { padding: 20px; }
      .cta-section { padding: 24px 16px; }
      .cta-button { width: 100%; box-sizing: border-box; }
    }
  </style>
</head>
<body>
<table class="email-container" width="600" cellpadding="0" cellspacing="0">
  <tr>
    <td class="header">
      <img src="https://concise.onrender.com/assets/logo-concise-white.svg" alt="Concise">
    </td>
  </tr>
  <tr>
    <td class="body">
      <h1>Medical Exam Mastery - now bundled for $49.</h1>
      <p>MCAT Prep Guide V2 + the Nuclear Medicine Review Book are the two highest-priority titles for early Concise readers. Bundle them together, save $10, and keep both on your phone or tablet.</p>
      <div class="bundle-card">
        <h2>What's inside the bundle</h2>
        <ul>
          <li>MCAT Prep Guide V2 - chapters broken into 13 bite-sized study moves.</li>
          <li>Nuclear Medicine Review Book - distilled mnemonics for board-style questions.</li>
          <li>Bonus: Priority access to future Medical Exam updates.</li>
        </ul>
        <p class="price">$49 | saves $10 vs buying both titles separately.</p>
      </div>
      <p>Bundle includes the full PDFs, ready to download immediately after purchase. Keep one on your device and one in your study folder.</p>
    </td>
  </tr>
  <tr>
    <td class="cta-section">
      <a class="cta-button" href="https://concise.onrender.com/bundles/medical-exam-mastery">Grab the bundle</a>
    </td>
  </tr>
  <tr>
    <td class="footer">
      <p>(c) 2026 Concise. All rights reserved.</p>
      <p><a href="https://concise.onrender.com/privacy">Privacy Policy</a> | <a href="https://concise.onrender.com/terms">Terms</a> | <a href="[unsubscribe-link]">Unsubscribe</a></p>
    </td>
  </tr>
</table>
</body>
</html>
```

### Plain text

Subject: Medical Exam Mastery bundle - $49 for both MCAT & Nuclear Med  
Preview: Combine MCAT Prep Guide V2 and the Nuclear Medicine review for a $10 savings.  

```
Hi {{first_name|default:"friend"}},

MCAT Prep Guide V2 + the Nuclear Medicine Review Book make up the Medical Exam Mastery bundle. Each title is already selling well on its own; together they unlock both exams and include a $10 savings.

Bundle includes:
- MCAT Prep Guide V2 (13 bite-sized study moves)
- Nuclear Medicine Review (mnemonics for every board-style topic)
- Bonus: priority access to future Medical Exam updates

Bundle price: $49 (save $10 vs buying them separately)
https://concise.onrender.com/bundles/medical-exam-mastery

Concise | https://concise.onrender.com | Unsubscribe: [unsubscribe-link]
```

## Email 5 - Day 5: Social proof & testimonial
**Subject lines:**  
- Readers say: Concise feels like a coaching call  
- Concise note from a pre-med who actually stuck to a plan  
**Preview text:** A reader writes back - "This cut the fluff and kept me honest."  
**Goal:** Bring in real reader feedback, encourage sharing, and reinforce the CTA to browse the shop.

### HTML
```html
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: Inter, Arial, sans-serif; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse; }
    .header { background-color: #1a2a4d; padding: 16px 20px; text-align: center; }
    .header img { height: 48px; }
    .body { padding: 40px 20px; color: #2c3e50; }
    .body h1 { font-size: 24px; margin-bottom: 16px; color: #1a2a4d; }
    .body p { margin-bottom: 16px; line-height: 1.6; }
    .testimonial { border-left: 4px solid #00d9ff; padding-left: 12px; margin-bottom: 16px; color: #1a2a4d; }
    .cta-section { background-color: #f5f5f5; padding: 32px 20px; text-align: center; }
    .cta-button {
      display: inline-block;
      background-color: #1a2a4d;
      color: #ffffff;
      border: 2px solid #00d9ff;
      padding: 16px 32px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .footer { padding: 20px; background-color: #f5f5f5; text-align: center; font-size: 11pt; color: #2c3e50; }
    .footer a { color: #1a2a4d; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .body { padding: 20px; }
      .cta-section { padding: 24px 16px; }
      .cta-button { width: 100%; box-sizing: border-box; }
    }
  </style>
</head>
<body>
<table class="email-container" width="600" cellpadding="0" cellspacing="0">
  <tr>
    <td class="header">
      <img src="https://concise.onrender.com/assets/logo-concise-white.svg" alt="Concise">
    </td>
  </tr>
  <tr>
    <td class="body">
      <h1>"Concise felt like a coaching call."</h1>
      <div class="testimonial">
        <p>"This cut the fluff and kept me honest. I read one chapter, responded to the five question prompts, and suddenly my MCAT study calendar makes sense again. I already have my second purchase waiting." - Mira, future ER doctor</p>
      </div>
      <p>If this kind of precision kept Mira honest, it can keep you honest too. Reply with your own questions, share the quote with a friend, or browse every Concise title when you are ready.</p>
    </td>
  </tr>
  <tr>
    <td class="cta-section">
      <a class="cta-button" href="https://concise.onrender.com/shop">Browse Concise titles</a>
    </td>
  </tr>
  <tr>
    <td class="footer">
      <p>(c) 2026 Concise. All rights reserved.</p>
      <p><a href="https://concise.onrender.com/privacy">Privacy Policy</a> | <a href="https://concise.onrender.com/terms">Terms</a> | <a href="[unsubscribe-link]">Unsubscribe</a></p>
    </td>
  </tr>
</table>
</body>
</html>
```

### Plain text

Subject: Readers say: Concise feels like a coaching call  
Preview: A reader writes back - "This cut the fluff and kept me honest."  

```
Hi {{first_name|default:"friend"}},

"This cut the fluff and kept me honest. I read one chapter, answered the five prompts, and suddenly my MCAT calendar makes sense." - Mira, future ER doctor.

Share the quote if it helps someone you know. Reply with your questions or browse the full Concise catalog when you are ready:
https://concise.onrender.com/shop

Concise | https://concise.onrender.com | Unsubscribe: [unsubscribe-link]
```
