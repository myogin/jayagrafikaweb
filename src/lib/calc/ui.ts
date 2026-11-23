import { angka, parseAngka, rupiah } from "./format";
import { hitungHpp, type HppInput, type HppResult } from "./hpp";
import { JENIS_CETAK, LAMINASI, PLAT, type JenisCetak, type JenisLaminasi, type Mesin, type Sisi, type UkuranPlat } from "./presets";
import { type AddOnForm, type FormState, toInput } from "./state";

type AddOnKey = "tali" | "kertasAlas" | "kertasKuping" | "lem";
const ADDON: AddOnKey[] = ["tali", "kertasAlas", "kertasKuping", "lem"];

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Harga per pcs tampil tanpa desimal kecuali di bawah Rp1.000 (sama seperti app lama).
const hargaPcs = (n: number) => (n > 0 && n < 1000 ? `Rp ${angka(n)}` : rupiah(n));
const ukuran = (p: number | null, l: number | null) => (p && l ? `${angka(p)} × ${angka(l)} cm` : "–");

function bacaForm(form: HTMLFormElement): FormState {
  const el = form.elements;
  const val = (name: string) => {
    const e = el.namedItem(name) as HTMLInputElement | RadioNodeList | HTMLSelectElement | null;
    return e ? e.value : "";
  };
  const cek = (name: string) => (el.namedItem(name) as HTMLInputElement | null)?.checked ?? false;
  const addOn = (k: AddOnKey): AddOnForm => ({
    aktif: cek(`${k}.aktif`),
    harga: val(`${k}.harga`),
    qty: val(`${k}.qty`),
    catatan: val(`${k}.catatan`),
  });

  return {
    jenisCetakan: val("jenisCetakan"),
    qtyOrder: val("qtyOrder"),
    jenisKertas: val("jenisKertas"),
    gramatur: val("gramatur"),
    planoP: val("planoP"),
    planoL: val("planoL"),
    cetakP: val("cetakP"),
    cetakL: val("cetakL"),
    isiPlanoManual: val("isiPlanoManual"),
    jumlah: val("jumlah"),
    layout: val("layout"),
    hargaKertas: val("hargaKertas"),
    ukuranPlat: val("ukuranPlat") as UkuranPlat,
    hargaPlat: val("hargaPlat"),
    jumlahPlatManual: val("jumlahPlatManual"),
    mesin: val("mesin") as Mesin,
    jenisCetak: val("jenisCetak") as JenisCetak,
    ongkosCetak: val("ongkosCetak"),
    laminasi: val("laminasi") as JenisLaminasi,
    tarifLaminasi: val("tarifLaminasi"),
    sisiLaminasi: Number(val("sisiLaminasi")) as Sisi,
    pisau: val("pisau"),
    plong: val("plong"),
    jasaPotong: val("jasaPotong"),
    finishing: val("finishing"),
    taliJenis: val("taliJenis"),
    tali: addOn("tali"),
    kertasAlas: addOn("kertasAlas"),
    kertasKuping: addOn("kertasKuping"),
    lem: addOn("lem"),
  };
}

/** Bagian form yang bergantung pada hasil hitungan: placeholder auto, hint rotasi, field kondisional. */
function perbaruiForm(form: HTMLFormElement, f: FormState, h: HppResult) {
  const input = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
  const hint = (name: string, teks: string) => {
    const e = form.querySelector<HTMLElement>(`[data-hint="${name}"]`);
    if (e) e.textContent = teks;
  };

  input("isiPlanoManual").placeholder = h.isiPlanoAuto ? `Auto: ${h.isiPlanoAuto}` : "Auto";
  hint(
    "isiPlanoManual",
    h.isiPlanoRotasi > h.isiPlanoAuto
      ? `Auto 1/${h.isiPlanoAuto}. Kalau diputar bisa 1/${h.isiPlanoRotasi}.`
      : "Kosongkan untuk hitung otomatis.",
  );
  input("hargaPlat").placeholder = angka(PLAT[f.ukuranPlat].harga);
  input("jumlahPlatManual").placeholder = `Auto: ${h.jumlahPlat}`;

  const lam = form.querySelector<HTMLElement>("[data-laminasi-detail]")!;
  lam.hidden = f.laminasi === "tidak";
  if (f.laminasi !== "tidak") input("tarifLaminasi").placeholder = angka(LAMINASI[f.laminasi].tarif);

  const qtyDefault = parseAngka(f.qtyOrder) || parseAngka(f.jumlah) || 0;
  for (const k of ADDON) {
    form.querySelector<HTMLElement>(`[data-addon="${k}"]`)!.hidden = !f[k].aktif;
    hint(`${k}.qty`, `Kosong = quantity order (${angka(qtyDefault)})`);
  }

  for (const b of form.querySelectorAll<HTMLButtonElement>("[data-plano]")) {
    b.setAttribute("aria-pressed", String(b.dataset.plano === `${f.planoP}x${f.planoL}`));
  }
}

const kartu = "rounded-xl border border-line bg-surface";
const judulKartu = "border-b border-line px-4 py-3 text-[13px] font-semibold tracking-wider text-muted uppercase";

function htmlHasil(h: HppResult, jenisCetakan: string): string {
  const judul = [jenisCetakan && esc(jenisCetakan), h.qtyOrder > 0 && `${angka(h.qtyOrder)} pcs`].filter(Boolean).join(" · ");

  if (h.errors.length > 0) {
    return `
      <div class="${kartu} overflow-hidden">
        <div class="cmyk-bar h-1"></div>
        <div class="p-5">
          <h2 class="text-base font-semibold">Lengkapi data untuk melihat hasil</h2>
          <ul class="mt-3 space-y-2 text-sm text-warn-ink">
            ${h.errors
              .map(
                (e) => `<li class="flex gap-2 rounded-lg border border-warn-line bg-warn-bg px-3 py-2">
                  <svg class="mt-0.5 size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                  <span>${esc(e)}</span></li>`,
              )
              .join("")}
          </ul>
        </div>
      </div>`;
  }

  const stat = [
    ["Isi plano", h.isiPlano ? `1/${h.isiPlano}` : "–"],
    ["Lembar cetak", angka(h.lembarCetak)],
    ["Jumlah plano", angka(h.jumlahPlano)],
  ];

  return `
    <div class="flex flex-col gap-4">
      <div class="overflow-hidden rounded-xl bg-brand text-white">
        <div class="cmyk-bar h-1"></div>
        <div class="p-5">
          ${judul ? `<div class="mb-3 text-sm font-medium text-white/85">${judul}</div>` : ""}
          <div class="text-sm text-white/70">Total HPP</div>
          <div class="font-mono text-3xl font-semibold tabular-nums">${rupiah(h.total)}</div>
          <div class="mt-4 flex items-baseline justify-between border-t border-white/15 pt-3">
            <span class="text-sm text-white/70">HPP per pcs</span>
            <span class="font-mono text-xl font-semibold tabular-nums">${hargaPcs(h.perPcs)}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2">
        ${stat
          .map(
            ([l, v]) => `<div class="${kartu} px-2 py-3 text-center">
              <div class="text-xs text-muted">${l}</div>
              <div class="mt-0.5 font-mono text-lg font-semibold tabular-nums">${v}</div>
            </div>`,
          )
          .join("")}
      </div>

      <div class="${kartu}">
        <h2 class="${judulKartu}">Harga jual</h2>
        <table class="w-full text-sm">
          <thead class="text-xs text-muted">
            <tr>
              <th scope="col" class="px-4 pt-3 pb-1 text-left font-normal">Markup</th>
              <th scope="col" class="px-4 pt-3 pb-1 text-right font-normal">Per pcs</th>
              <th scope="col" class="px-4 pt-3 pb-1 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            ${h.hargaJual
              .map(
                (j) => `<tr class="border-t border-line">
                  <td class="px-4 py-2.5 font-medium">+${j.persen}%</td>
                  <td class="px-4 py-2.5 text-right font-mono font-semibold tabular-nums">${hargaPcs(j.perPcs)}</td>
                  <td class="px-4 py-2.5 text-right font-mono tabular-nums text-muted">${rupiah(j.total)}</td>
                </tr>`,
              )
              .join("")}
          </tbody>
        </table>
        <p class="px-4 pt-1 pb-3 text-xs text-muted">Harga jual = HPP per pcs × (1 + markup).</p>
      </div>

      <div class="${kartu}">
        <h2 class="${judulKartu}">Rincian biaya</h2>
        <ul class="divide-y divide-line">
          ${h.rincian
            .map(
              (r) => `<li class="flex items-start justify-between gap-3 px-4 py-3">
                <div class="min-w-0">
                  <div class="text-sm font-medium">${esc(r.label)}</div>
                  <div class="mt-0.5 font-mono text-xs break-words text-muted">${esc(r.rumus)}</div>
                </div>
                <div class="shrink-0 font-mono text-sm font-semibold tabular-nums">${rupiah(r.nilai)}</div>
              </li>`,
            )
            .join("")}
          <li class="flex justify-between bg-brand-50 px-4 py-3 font-semibold">
            <span>Total</span>
            <span class="font-mono tabular-nums">${rupiah(h.total)}</span>
          </li>
        </ul>
      </div>
    </div>`;
}

/** Laporan HPP yang hanya tampil saat print / simpan PDF. */
function htmlCetak(input: HppInput, h: HppResult, tanggal: string): string {
  const spek: [string, string][] = [
    ["Jenis kertas", [input.jenisKertas, input.gramatur && `${angka(input.gramatur)} gsm`].filter(Boolean).join(" ") || "–"],
    ["Ukuran plano", ukuran(input.planoP, input.planoL)],
    ["Ukuran kertas cetak", ukuran(input.cetakP, input.cetakL)],
    ["Isi per plano", h.isiPlano ? `1/${h.isiPlano}` : "–"],
    ["Jumlah kertas cetak", angka(input.jumlah ?? 0)],
    ["Plat / layout", input.layout && input.layout > 1 ? `1/${angka(input.layout)}` : "–"],
    ["Lembar cetak", angka(h.lembarCetak)],
    ["Jumlah plano", angka(h.jumlahPlano)],
    ["Plat", `${input.ukuranPlat}, ${angka(h.jumlahPlat)} plat`],
    ["Ongkos cetak", `Mesin ${input.mesin}, ${JENIS_CETAK[input.jenisCetak].label}`],
    ["Laminasi", input.laminasi === "tidak" ? "Tidak" : `${LAMINASI[input.laminasi].label} ${input.sisiLaminasi} sisi`],
  ];
  const baris = Array.from({ length: Math.ceil(spek.length / 2) }, (_, i) => spek.slice(i * 2, i * 2 + 2));
  const th = "border-b border-zinc-400 py-1 text-left font-semibold";
  const td = "border-b border-zinc-200 py-1 align-top";
  const sub = [input.jenisCetakan || "Tanpa nama", h.qtyOrder > 0 && `${angka(h.qtyOrder)} pcs`].filter(Boolean).join(" · ");

  return `
    <header class="mb-5 flex items-end justify-between border-b-2 border-black pb-2">
      <div>
        <h1 class="text-xl font-bold">Harga Pokok Produksi Cetak</h1>
        <p class="text-sm">${esc(sub)}</p>
      </div>
      <div class="flex flex-col items-end gap-1">
        <img src="/logo-jayagrafika.png" alt="Jaya Grafika" class="h-[14mm] w-auto" />
        <p class="text-sm">${tanggal}</p>
      </div>
    </header>

    <section class="mb-5 break-inside-avoid">
      <h2 class="mb-1 font-bold">Spesifikasi</h2>
      <table class="w-full"><tbody>
        ${baris
          .map(
            (b) =>
              `<tr>${b
                .map(
                  ([k, v]) =>
                    `<td class="${td} w-[22%] whitespace-nowrap pr-3 text-zinc-600">${k}</td><td class="${td} w-[28%] pr-4">${esc(v)}</td>`,
                )
                .join("")}</tr>`,
          )
          .join("")}
      </tbody></table>
    </section>

    <section class="mb-5 break-inside-avoid">
      <h2 class="mb-1 font-bold">Rincian biaya</h2>
      <table class="w-full">
        <thead><tr>
          <th class="${th}">Komponen</th><th class="${th}">Perhitungan</th><th class="${th} text-right">Biaya</th>
        </tr></thead>
        <tbody>
          ${h.rincian
            .map(
              (r) => `<tr>
                <td class="${td}">${esc(r.label)}</td>
                <td class="${td} text-zinc-600">${esc(r.rumus)}</td>
                <td class="${td} text-right tabular-nums">${rupiah(r.nilai)}</td>
              </tr>`,
            )
            .join("")}
          <tr class="font-bold"><td class="py-1.5" colspan="2">Total HPP</td><td class="py-1.5 text-right tabular-nums">${rupiah(h.total)}</td></tr>
          <tr class="font-bold">
            <td class="py-1.5" colspan="2">HPP per pcs (${rupiah(h.total)} / ${angka(h.qtyOrder)} pcs)</td>
            <td class="py-1.5 text-right tabular-nums">${hargaPcs(h.perPcs)}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="break-inside-avoid">
      <h2 class="mb-1 font-bold">Harga jual</h2>
      <table class="w-full">
        <thead><tr>
          <th class="${th}">Markup</th><th class="${th} text-right">Per pcs</th><th class="${th} text-right">Total (${angka(h.qtyOrder)} pcs)</th>
        </tr></thead>
        <tbody>
          ${h.hargaJual
            .map(
              (j) => `<tr>
                <td class="${td}">+${j.persen}%</td>
                <td class="${td} text-right tabular-nums">${hargaPcs(j.perPcs)}</td>
                <td class="${td} text-right tabular-nums">${rupiah(j.total)}</td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <p class="mt-1 text-xs text-zinc-600">Harga jual = HPP per pcs × (1 + markup).</p>
    </section>`;
}

export function mulai() {
  const form = document.querySelector<HTMLFormElement>("#form-hpp")!;
  const hasilEl = document.querySelector<HTMLElement>("#hasil")!;
  const cetakEl = document.querySelector<HTMLElement>("#cetak")!;
  const btnPdf = document.querySelector<HTMLButtonElement>("#btn-pdf")!;
  const barLabel = document.querySelector<HTMLElement>("[data-bar-label]")!;
  const barNilai = document.querySelector<HTMLElement>("[data-bar-nilai]")!;

  let state = bacaForm(form);
  let input = toInput(state);
  let hasil = hitungHpp(input);

  const render = () => {
    state = bacaForm(form);
    input = toInput(state);
    hasil = hitungHpp(input);
    const siap = hasil.errors.length === 0;

    perbaruiForm(form, state, hasil);
    hasilEl.innerHTML = htmlHasil(hasil, input.jenisCetakan);
    btnPdf.disabled = !siap;
    barLabel.textContent = siap ? "Total HPP · lihat rincian ↓" : "Lengkapi input · lihat ↓";
    barNilai.textContent = siap ? rupiah(hasil.total) : "–";
  };

  form.addEventListener("input", render);
  form.addEventListener("change", (e) => {
    // Ukuran plat otomatis mengikuti mesin; tetap bisa diganti manual setelahnya.
    const t = e.target as HTMLInputElement;
    if (t.name === "mesin") (form.elements.namedItem("ukuranPlat") as HTMLSelectElement).value = t.value;
    render();
  });
  form.addEventListener("reset", () => setTimeout(render));

  form.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-plano]");
    if (!b) return;
    const [p, l] = b.dataset.plano!.split("x");
    (form.elements.namedItem("planoP") as HTMLInputElement).value = p;
    (form.elements.namedItem("planoL") as HTMLInputElement).value = l;
    render();
  });

  const siapkanCetak = () => {
    const tanggal = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    cetakEl.innerHTML = htmlCetak(input, hasil, tanggal);
  };
  window.addEventListener("beforeprint", siapkanCetak);

  btnPdf.addEventListener("click", () => {
    if (hasil.errors.length > 0) return;
    siapkanCetak();
    // Judul dokumen dipakai browser sebagai nama file PDF.
    const judulAsli = document.title;
    const nama = [input.jenisCetakan || "HPP Cetak", hasil.qtyOrder > 0 && `${angka(hasil.qtyOrder)} pcs`].filter(Boolean).join(" ");
    document.title = `HPP ${nama}`.replace(/^HPP HPP/, "HPP");
    window.print();
    document.title = judulAsli;
  });

  render();
}
