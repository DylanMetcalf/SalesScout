import { test } from "node:test";
import assert from "node:assert/strict";
import { assertPublicUrl, domainOf, normaliseUrl } from "../src/lib/security/url";

test("normalises user-entered addresses", () => {
  assert.equal(normaliseUrl("acme.com"), "https://acme.com/");
  assert.equal(normaliseUrl(" http://Acme.com/about#team "), "http://acme.com/about");
  assert.equal(normaliseUrl("not a url"), null);
  assert.equal(normaliseUrl("javascript:alert(1)"), null);
  assert.equal(normaliseUrl(""), null);
});

test("extracts comparable domains for duplicate protection", () => {
  assert.equal(domainOf("https://www.Acme.co.za/contact"), "acme.co.za");
  assert.equal(domainOf("acme.co.za"), "acme.co.za");
  assert.equal(domainOf(null), null);
});

test("blocks private and local addresses (SSRF guard)", async () => {
  for (const u of ["http://localhost/", "http://127.0.0.1/", "http://10.0.0.5/", "http://192.168.1.1/", "http://169.254.169.254/latest/meta-data", "http://[::1]/", "http://printer.local/"]) {
    await assert.rejects(assertPublicUrl(u), /publicly reachable|web addresses/, u);
  }
  await assert.rejects(assertPublicUrl("file:///etc/passwd"));
});
