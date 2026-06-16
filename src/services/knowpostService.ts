import { apiFetch } from "./apiClient";
import type {
  CreateDraftResponse,
  PresignRequest,
  PresignResponse,
  ConfirmContentRequest,
  UpdateKnowPostRequest,
  FeedResponse,
  KnowpostDetailResponse,
  LikeActionResponse,
  FavActionResponse,
  CounterResponse,
  VisibleScope
} from "@/types/knowpost";

const KNOWPOST_PREFIX = "/api/v1/knowposts";
const STORAGE_PREFIX = "/api/v1/storage";

export const knowpostService = {
  createDraft: () =>
    apiFetch<CreateDraftResponse>(`${KNOWPOST_PREFIX}/drafts`, { method: "POST" }),

  presign: (payload: PresignRequest) =>
    apiFetch<PresignResponse>(`${STORAGE_PREFIX}/presign`, { method: "POST", body: payload }),

  confirmContent: (id: string, payload: ConfirmContentRequest) =>
    apiFetch<void>(`${KNOWPOST_PREFIX}/${id}/content/confirm`, { method: "POST", body: payload }),

  update: (id: string, payload: UpdateKnowPostRequest) =>
    apiFetch<void>(`${KNOWPOST_PREFIX}/${id}`, { method: "PATCH", body: payload }),

  publish: (id: string) =>
    apiFetch<void>(`${KNOWPOST_PREFIX}/${id}/publish`, { method: "POST" })
  ,
  
  // 设置置顶（需鉴权）
  setTop: (id: string, isTop: boolean, accessToken: string) =>
    apiFetch<void>(`${KNOWPOST_PREFIX}/${id}/top`, {
      method: "PATCH",
      body: { isTop },
      accessToken
    })
  ,

  // 设置可见性（需鉴权）
  setVisibility: (id: string, visible: VisibleScope, accessToken: string) =>
    apiFetch<void>(`${KNOWPOST_PREFIX}/${id}/visibility`, {
      method: "PATCH",
      body: { visible },
      accessToken
    })
  ,

  // 删除知文（需鉴权）
  remove: (id: string, accessToken: string) =>
    apiFetch<void>(`${KNOWPOST_PREFIX}/${id}`, {
      method: "DELETE",
      accessToken
    })
  ,

  // 获取首页 Feed 列表（公开内容）
  feed: (page = 1, size = 20) =>
    apiFetch<FeedResponse>(`${KNOWPOST_PREFIX}/feed?page=${page}&size=${size}`)
  ,

  // 获取我的知文（需鉴权）
  mine: (page = 1, size = 20, accessToken: string) =>
    apiFetch<FeedResponse>(`${KNOWPOST_PREFIX}/mine?page=${page}&size=${size}`, {
      accessToken
    })
  ,

  // 获取知文详情（公开内容无需鉴权；非公开需要作者凭证）
  detail: (id: string, accessToken?: string) =>
    apiFetch<KnowpostDetailResponse>(`${KNOWPOST_PREFIX}/detail/${id}`, {
      accessToken: accessToken ?? null
    })
  ,

  // 生成知文摘要（需鉴权）
  suggestDescription: (content: string, accessToken: string) =>
    apiFetch<{ description: string }>(`${KNOWPOST_PREFIX}/description/suggest`, {
      method: "POST",
      body: { content },
      accessToken
    })
  ,

  // 点赞/取消点赞（需鉴权）
  like: (entityId: string, accessToken: string, entityType: string = "knowpost") =>
    apiFetch<LikeActionResponse>(`/api/v1/action/like`, {
      method: "POST",
      body: { entityType, entityId },
      accessToken
    })
  ,
  unlike: (entityId: string, accessToken: string, entityType: string = "knowpost") =>
    apiFetch<LikeActionResponse>(`/api/v1/action/unlike`, {
      method: "POST",
      body: { entityType, entityId },
      accessToken
    })
  ,

  // 收藏/取消收藏（需鉴权）
  fav: (entityId: string, accessToken: string, entityType: string = "knowpost") =>
    apiFetch<FavActionResponse>(`/api/v1/action/fav`, {
      method: "POST",
      body: { entityType, entityId },
      accessToken
    })
  ,
  unfav: (entityId: string, accessToken: string, entityType: string = "knowpost") =>
    apiFetch<FavActionResponse>(`/api/v1/action/unfav`, {
      method: "POST",
      body: { entityType, entityId },
      accessToken
    })
  ,

  // 获取计数（需鉴权）
  counters: (entityId: string, accessToken: string, entityType: string = "knowpost") =>
    apiFetch<CounterResponse>(`/api/v1/counter/${entityType}/${entityId}?metrics=like,fav`, {
      accessToken
    })
};

/**
 * 直传到预签名 URL。注意：S3/OSS 会在响应头返回 ETag。
 */
export async function uploadToPresigned(putUrl: string, headers: Record<string, string>, file: File) {
  const resp = await fetch(putUrl, {
    method: "PUT",
    headers,
    body: file,
    // 跨域上传通常不需要携带凭据
    credentials: "omit"
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `上传失败：${resp.status}`);
  }
  // ETag 常带双引号
  const etag = resp.headers.get("ETag") || resp.headers.get("etag") || "";
  return { etag };
}

// SHA-256 纯 JS 实现，用于 HTTP 环境（crypto.subtle 仅在 HTTPS/localhost 可用）
function sha256Pure(bytes: Uint8Array): Uint8Array {
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ];
  const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const bits = bytes.length * 8;
  const pad = new Uint8Array(((bytes.length + 9 + 63) >>> 9) << 6 + 8);
  pad.set(bytes);
  pad[bytes.length] = 0x80;
  new DataView(pad.buffer).setUint32(pad.length - 8, (bits / 0x100000000) >>> 0);
  new DataView(pad.buffer).setUint32(pad.length - 4, bits >>> 0);
  const w = new Uint32Array(64);
  const dv = new DataView(pad.buffer);
  for (let i = 0; i < pad.length; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4);
    for (let t = 16; t < 64; t++) {
      const s0 = (w[t-15]>>>7|w[t-15]<<25)^(w[t-15]>>>18|w[t-15]<<14)^(w[t-15]>>>3);
      const s1 = (w[t-2]>>>17|w[t-2]<<15)^(w[t-2]>>>19|w[t-2]<<13)^(w[t-2]>>>10);
      w[t] = (w[t-16] + s0 + w[t-7] + s1) >>> 0;
    }
    let [a,b,c,d,e,f,g,h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = (e>>>6|e<<26)^(e>>>11|e<<21)^(e>>>25|e<<7);
      const ch = (e&f)^(~e&g);
      const T1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
      const S0 = (a>>>2|a<<30)^(a>>>13|a<<19)^(a>>>22|a<<10);
      const maj = (a&b)^(a&c)^(b&c);
      const T2 = (S0 + maj) >>> 0;
      h=g; g=f; f=e; e=(d+T1)>>>0; d=c; c=b; b=a; a=(T1+T2)>>>0;
    }
    for (let t = 0; t < 8; t++) H[t] = (H[t] + [a,b,c,d,e,f,g,h][t]) >>> 0;
  }
  const out = new Uint8Array(32);
  for (let t = 0; t < 8; t++) { out[t*4]=(H[t]>>>24)&0xff; out[t*4+1]=(H[t]>>>16)&0xff; out[t*4+2]=(H[t]>>>8)&0xff; out[t*4+3]=H[t]&0xff; }
  return out;
}

export async function computeSha256(file: File) {
  const buf = await file.arrayBuffer();
  let digest: ArrayBuffer | Uint8Array;
  try {
    // 优先用浏览器原生 crypto（HTTPS / localhost 可用）
    digest = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
  } catch {
    // HTTP 环境 crypto.subtle 不可用，走纯 JS 实现
    digest = sha256Pure(new Uint8Array(buf));
  }
  const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex;
}