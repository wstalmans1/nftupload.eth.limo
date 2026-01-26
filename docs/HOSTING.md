# Hosting (IPFS + IPNS + ENS)

This app is designed for **static hosting**. The recommended flow is:

1) Build static assets
```
pnpm -C apps/web build
```
Output is in `apps/web/out`.

2) Pin the static site to IPFS
- Pin the **contents** of `apps/web/out` (not the folder itself), so the root resolves correctly.
- Your pinning provider will return a **CID**.

3) Publish the CID to IPNS
- Create or use an existing IPNS key.
- Publish the latest site CID to that key.
- This gives you a stable IPNS name that can be updated on new deploys.

4) Point ENS to IPNS (contenthash)
- In your ENS name, set the **contenthash** to the IPNS name.
- With an `.eth.limo` gateway, the site becomes accessible at:
  - `https://<name>.eth.limo`

## Notes
- IPNS adds a stable pointer so you can update the site without changing the ENS record each time.
- If you prefer to skip IPNS, you can set the ENS contenthash directly to the IPFS CID, but you must update it on every deploy.
- Make sure you pin the **exported static output** (`apps/web/out`) and not the Next.js source.

## Suggested deployment checklist
- Update envs (contract address, RPC, WC project id, Pinata JWT)
- Build: `pnpm -C apps/web build`
- Pin `apps/web/out` to IPFS → get CID
- Publish CID to IPNS → get IPNS name
- Set ENS contenthash to IPNS
- Verify at `https://nftupload.eth.limo`
