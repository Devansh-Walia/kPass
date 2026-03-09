To get AdSense IDs:

  1. Go to adsense.google.com and sign up / sign in
  2. Add your Railway domain as a site (e.g. efficient-creation.up.railway.app)
  3. Google will review it — this can take a few days
  4. Once approved, create an ad unit > get your publisher ID (ca-pub-XXXXXXXX) and slot ID
  (1234567890)
  5. Set those as VITE_ADSENSE_CLIENT and VITE_ADSENSE_SLOT in Railway, then redeploy

  Until then, the AdBanner component will just render an empty placeholder — no errors. Hit Deploy
  to get your app live first.
