/**
 * Simpan isi form ke localStorage supaya hitungan tidak hilang saat halaman
 * ter-reload (pull-to-refresh, tab dibuang browser, dsb).
 * Disimpan per `name` elemen, jadi tidak perlu diubah kalau field bertambah.
 */
const KEY = "jg-hpp-form-v1";

type Simpanan = Record<string, string | boolean>;

const elemen = (form: HTMLFormElement) =>
  Array.from(form.elements).filter(
    (e): e is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
      (e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement) && !!e.name,
  );

export function simpanForm(form: HTMLFormElement) {
  const data: Simpanan = {};
  for (const e of elemen(form)) {
    if (e instanceof HTMLInputElement && e.type === "checkbox") data[e.name] = e.checked;
    else if (e instanceof HTMLInputElement && e.type === "radio") {
      if (e.checked) data[e.name] = e.value;
    } else data[e.name] = e.value;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage diblokir / penuh: kalkulator tetap jalan tanpa simpanan.
  }
}

export function pulihkanForm(form: HTMLFormElement): boolean {
  let data: Simpanan;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    data = JSON.parse(raw);
    if (!data || typeof data !== "object") return false;
  } catch {
    return false;
  }
  for (const e of elemen(form)) {
    if (!(e.name in data)) continue;
    const v = data[e.name];
    if (e instanceof HTMLInputElement && e.type === "checkbox") e.checked = v === true;
    else if (e instanceof HTMLInputElement && e.type === "radio") e.checked = e.value === v;
    else if (typeof v === "string") e.value = v;
  }
  return true;
}

export function hapusSimpanan() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // abaikan
  }
}
