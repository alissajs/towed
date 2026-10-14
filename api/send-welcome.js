export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, first } = req.body;
  if (!email || !first) return res.status(400).json({ error: 'Missing fields' });
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'TOWED <noreply@towed.nyc>',
        to: [email],
        subject: 'Welcome to Towed 🚗',
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0E1013;color:#F2F2EE;padding:32px;border-radius:16px"><div style="font-weight:900;font-size:32px;letter-spacing:6px;color:#FFC83D;margin-bottom:8px">TOWED</div><div style="font-size:13px;color:#8B8F98;margin-bottom:24px">NYC Parking Survival</div><div style="font-size:20px;font-weight:800;margin-bottom:12px">Hey ${first}, you're in! 🎉</div><div style="font-size:15px;color:#B9BCC3;line-height:1.6;margin-bottom:24px">Welcome to Towed — the only app built to keep NYC drivers from getting towed or ticketed.</div><div style="background:#181B20;border-radius:12px;padding:20px;margin-bottom:24px"><div style="font-size:13px;font-weight:700;color:#FFC83D;margin-bottom:12px">WHAT YOU CAN DO</div><div style="font-size:14px;color:#B9BCC3;margin-bottom:8px">🔢 Check any of 15,000+ NYC meters instantly</div><div style="font-size:14px;color:#B9BCC3;margin-bottom:8px">📍 Find safe parking near your location</div><div style="font-size:14px;color:#B9BCC3;margin-bottom:8px">🧹 Check alternate side parking on your block</div><div style="font-size:14px;color:#B9BCC3">🔔 Get alerts before your meter expires</div></div><a href="https://towed.nyc" style="display:block;background:#FFC83D;color:#0E1013;text-decoration:none;text-align:center;padding:16px;border-radius:12px;font-weight:900;font-size:16px;margin-bottom:20px">Check a Meter Now →</a><div style="font-size:11px;color:#444460;text-align:center">© 2026 Towed, LLC · towed.nyc</div></div>`
      })
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}