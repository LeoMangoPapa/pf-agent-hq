name = "pf-agent-hq"
main = "worker.js"
compatibility_date = "2026-01-01"
workers_dev = true
[assets]
directory = "./public"
binding = "ASSETS"
run_worker_first = true
[[kv_namespaces]]
binding = "HQ"
id = "__KV_ID__"
