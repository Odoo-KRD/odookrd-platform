# Uptime monitoring

Errors are reported to Sentry, but Sentry only sees failures the application
manages to report. A process that has crashed, a box that is off, or a
certificate that has expired all produce silence. Something outside the server
has to notice that silence.

## What to poll

| Target | URL | Meaning |
| --- | --- | --- |
| API readiness | `https://api.odoo.krd/health/ready` | API is up **and** the database answers |
| API liveness | `https://api.odoo.krd/health/live` | API process is up, ignoring dependencies |
| Portal | `https://my.odoo.krd/api/health` | Portal is up **and** can reach the API |

Poll **API readiness** and **Portal**. Between them they cover the database,
the API, the portal and the network path a customer actually takes.

Liveness is useful when readiness fails: if liveness passes while readiness
does not, the API is running and the database is the problem. That distinction
is worth ten minutes at 2am.

All three return `200` when healthy and `503` otherwise, with a body of
`{"status":"ok"}` or `{"status":"error"}` and nothing else. No version number,
no dependency detail, no error text — they are polled from the public internet.

## The monitor must not run on this server

A monitor on the same box cannot tell you the box is down. Use either:

- **A hosted checker** — UptimeRobot, Better Stack and similar have free tiers
  adequate for two endpoints at one-minute intervals.
- **Uptime Kuma on separate infrastructure** — self-hosted, but only if it runs
  somewhere else. On the same machine it is worse than nothing, because it
  creates the impression of monitoring without the substance.

## Suggested settings

- **Interval**: 60 seconds. Faster buys little and multiplies the readiness
  probe's database queries.
- **Confirmation**: alert after 2 consecutive failures. A single failed poll is
  usually a network blip.
- **Timeout**: 10 seconds. The readiness probe bounds its own database check at
  3 seconds, so a slow response means something beyond the database.
- **Certificate expiry**: warn 14 days ahead if the monitor supports it. An
  expired certificate takes the portal down as surely as a crash.

## Alerting

Email to start with. Once the Twilio WhatsApp integration exists, most monitors
can call a webhook, so it becomes a URL rather than a redesign.

Resist alerting on everything. An alert that fires often gets muted, and a
muted alert is worse than none — it reads as coverage while providing none.

## Verifying it works

A monitor that has never fired is unproven. Once configured, stop the API and
confirm the alert arrives:

```bash
sudo systemctl stop odookrd-api
# wait for two poll intervals, confirm the alert
sudo systemctl start odookrd-api
```

Do this deliberately, once, rather than discovering during a real outage that
the alert address was wrong.

## Log retention

Structured logging writes a JSON line per request, so journald volume is much
higher than it was. The defaults allow up to 10% of the filesystem, and disk
exhaustion takes down Postgres and both services together.

Install the bundled limits once:

```bash
sudo mkdir -p /etc/systemd/journald.conf.d
sudo cp deploy/journald/odookrd.conf /etc/systemd/journald.conf.d/
sudo systemctl restart systemd-journald
```

Check what the journal is actually using:

```bash
journalctl --disk-usage
```

If it approaches the 500M ceiling faster than a month, either raise
`SystemMaxUse` or reduce what is logged. Sentry holds the errors worth keeping
long term; journald holds the detail behind them.

## Releases

`deploy/deploy.sh` sets `SENTRY_RELEASE` from the deployed commit in both
environment files, builds, restarts and then verifies both health endpoints
answer before reporting success. Deploying by hand works, but the release tag
is what lets Sentry tell you which deploy introduced an issue, and it is easy
to forget.

```bash
./deploy/deploy.sh
```
