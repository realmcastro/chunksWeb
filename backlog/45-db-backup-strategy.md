---
prioridade: 45
categoria: data,operations
esforco: 1 dia
risco: medio
---

# DB backup + restore strategy

## Contexto

`chunks_v1.db` committed no repo (~MB típico, pre-populated). User-data tables (user_progress, sessions) growing. Sem backup automatizado em prod.

## Problema

- Single point of failure: disk corrompe = perde tudo
- Sem versionamento de snapshots
- Recovery time desconhecido

## Proposta

### Hot backup
- SQLite `VACUUM INTO` para copy atômico:
  ```ts
  db.exec(`VACUUM INTO 'backups/chunks-${timestamp}.db'`);
  ```
- Script `scripts/backup.ts` — cron diário
- Retain: last 7 daily, 4 weekly, 12 monthly

### Storage
- Local: `backups/` directory (gitignored)
- Cloud opt: S3 / R2 upload encrypted
- Compression: gzip antes de upload

### Restore
- Script `scripts/restore.ts <backup-file>`
- Stop app → swap chunks_v1.db → start app
- Validate: integrity check `PRAGMA integrity_check`

### WAL checkpoint
- Backups WAL-mode requer cuidado: include `chunks_v1.db-wal` + `-shm` ou checkpoint primeiro
- `db.pragma('wal_checkpoint(FULL)')` antes de VACUUM INTO

### Audit
- Log cada backup: timestamp, size, hash
- Alert se backup falha

## Arquivos

- `scripts/backup.ts`
- `scripts/restore.ts`
- `backups/.gitignore`
- Cron config (crontab, systemd timer, etc.)

## Validação

- [ ] Backup roda diariamente
- [ ] Restore testado em DR drill
- [ ] PITR (point-in-time recovery): documentar limitation (apenas snapshots, não streaming)
- [ ] Backup file size razoável (compressed)

## Decisões pendentes

- Local-only ou cloud (S3/R2/B2)?
- Encryption key: env var ou KMS?
- Frequency: 1× dia suficiente? Por incremental (WAL ship)?
