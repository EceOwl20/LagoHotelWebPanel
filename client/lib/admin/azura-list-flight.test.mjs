import test from "node:test";
import assert from "node:assert/strict";
import { shareAzuraList } from "./azura-list-flight.mjs";
import { requestAzuraBlog } from "./azura-blog.mjs";
import { requestAzuraPages } from "./azura-pages.mjs";
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; };
const options = () => ({ connection: { url: "https://example.test/api", token: "secret" }, resource: "blog", fetchImpl: () => {} });

test("only in-flight reads are shared; results are independently mutable", async () => {
  const o = options(), d = deferred(); let count=0;
  const run = () => { count++; return d.promise; };
  const a=shareAzuraList(o,run), b=shareAzuraList(o,run);
  d.resolve({ posts: [] });
  const [x,y]=await Promise.all([a,b]);
  assert.equal(count,1); x.posts.push("changed"); assert.deepEqual(y.posts,[]);
  await shareAzuraList(o,run); assert.equal(count,2);
});
test("connection, credentials, version and resource remain isolated", async () => {
  const o=options(), d=deferred(); let count=0;
  const variants=[o,{...o,version:3},{...o,resource:"pages"},
    {...o,connection:{...o.connection,token:"different"}},
    {...o,connection:{...o.connection,url:"https://other.test/api"}}];
  const tasks=variants.map(v=>shareAzuraList(v,()=>{count++;return d.promise;}));
  d.resolve({}); await Promise.all(tasks); assert.equal(count,5);
});
test("failed reads are released and can be retried", async () => {
  const o=options(), d=deferred();
  const a=shareAzuraList(o,()=>d.promise), b=shareAzuraList(o,()=>d.promise);
  d.reject(new Error("timeout"));
  assert.equal((await Promise.allSettled([a,b])).filter(r=>r.status==="rejected").length,2);
  assert.deepEqual(await shareAzuraList(o,()=>({fresh:true})),{fresh:true});
});
test("writes detach earlier reads and reads started during a write", async () => {
  const o=options(), old=deferred(), write=deferred(), during=deferred();
  const a=shareAzuraList(o,()=>old.promise);
  const w=shareAzuraList({...o,write:true},()=>write.promise);
  const b=shareAzuraList(o,()=>during.promise);
  write.resolve({}); await w;
  assert.deepEqual(await shareAzuraList(o,()=>({fresh:true})),{fresh:true});
  old.resolve({}); during.resolve({}); await Promise.all([a,b]);
});
test("real blog/pages collection clients share requests, without retaining completed responses", async () => {
  for (const [request,key] of [[requestAzuraBlog,"posts"],[requestAzuraPages,"pages"]]) {
    const d=deferred(); let count=0;
    const fetchImpl=async()=>{count++;await d.promise;return Response.json({[key]:[]});};
    const opts={env:{AZURA_EXPERIENCE_API_URL:"https://example.test/api/azura/homepage/experience",AZURA_SERVICE_TOKEN:"test-token",AZURA_BLOG_CONTRACT_VERSION:"3"},fetchImpl};
    const a=request("GET",undefined,opts), b=request("GET",undefined,opts);
    d.resolve(); await Promise.all([a,b]); assert.equal(count,1);
    await request("GET",undefined,opts); assert.equal(count,2);
  }
});
