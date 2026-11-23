# jayagrafikaweb

Website Jaya Grafika Bali, dibuat dengan Astro dan Tailwind CSS v4 dalam mode static.

| Halaman   | Isi                                                                                  |
| --------- | ------------------------------------------------------------------------------------ |
| `/`       | Halaman coming soon berisi kontak (company profile menyusul di fase 2)                |
| `/hitung` | Kalkulator HPP Cetak untuk internal (`noindex`), hasil port 1:1 dari `jayagrafikaCalculator` |

## Development

```sh
npm install
npm run dev      # http://localhost:4321
npm test         # Vitest, tes rumus HPP
npm run check    # type check
npm run build    # output ke dist/
```

Logika perhitungan ada di `src/lib/calc/`:

- `hpp.ts`: rumus, identik dengan app lama.
- `presets.ts`: harga plat, tarif laminasi, dan markup.
- `ui.ts`: render di browser.

Untuk mengubah harga bawaan, edit `presets.ts`, lalu push ke `main`.

## Deploy ke Cloudflare Pages (sekali setup)

1. Buka dashboard Cloudflare, pilih **Workers & Pages**, klik **Create**, buka tab **Pages**, lalu pilih **Connect to Git**.
2. Pilih repo `myogin/jayagrafikaweb`.
3. Isi pengaturan build:
   - Project name: `jayagrafika` (situs akan tersedia di `https://jayagrafika.pages.dev`)
   - Production branch: `main`
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `24` (sudah tercantum juga di `.nvmrc`)
4. Klik **Save and Deploy**.

Setelah itu, setiap push ke `main` otomatis ter-deploy, dan setiap PR mendapat URL preview.

Kalau nama `jayagrafika` sudah dipakai orang lain, ganti `site` di `astro.config.mjs` sesuai subdomain yang didapat.
