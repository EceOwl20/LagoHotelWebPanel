export async function readMediaReuseRequest(request) {
  const fail = (message, status) => { throw Object.assign(new Error(message), { status }); };
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    fail("Content-Type application/json olmalıdır.", 415);
  }
  const limit = 4096;
  if (Number(request.headers.get("content-length")) > limit) fail("İstek gövdesi çok büyük.", 413);
  const reader = request.body?.getReader();
  if (!reader) fail("Geçersiz JSON.", 400);
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); fail("İstek gövdesi çok büyük.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { fail("Geçersiz JSON.", 400); }
}
