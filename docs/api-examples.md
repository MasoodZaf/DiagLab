# API Examples

## Register patient and order

`POST /api/orders?tenant=lumen`

```json
{
  "actorRole": "receptionist",
  "actorName": "Sana Waheed",
  "branchName": "Gulberg",
  "fullName": "Sara Noor",
  "phone": "+92 300 555 8765",
  "nationalId": "35202-9999999-1",
  "dateOfBirth": "1996-03-18",
  "sex": "female",
  "scheduledAt": "2026-05-29T08:00:00Z",
  "channel": "home_collection",
  "tests": ["CBC", "TSH"],
  "homeCollection": true,
  "totalAmount": 5400,
  "currency": "PKR"
}
```

## Move sample through workflow

`PATCH /api/samples/sam_lum_1/status?tenant=lumen`

```json
{
  "actorRole": "technician",
  "actorName": "Usman Tariq",
  "nextStatus": "completed",
  "checkpoint": "CBC bench released for validation"
}
```

## Reconcile mobile offline queue

`POST /api/mobile-sync/reconcile?tenant=lumen`

```json
{
  "deviceId": "phleb-device-1",
  "actions": [
    {
      "clientActionId": "mobile-sample-complete-001",
      "tenantId": "tenant_lumen",
      "actor": {
        "id": "sess_lumen_tech",
        "tenantId": "tenant_lumen",
        "role": "technician",
        "displayName": "Usman Tariq",
        "branchName": "Central Lab",
        "capabilities": ["receive_sample"]
      },
      "type": "sample_transition",
      "entityId": "sam_lum_1",
      "occurredAt": "2026-05-29T08:00:00Z",
      "payload": {
        "nextStatus": "completed",
        "checkpoint": "Offline completion replayed from mobile"
      }
    }
  ]
}
```

## Record invoice payment

`POST /api/invoices/inv_lum_2/payments?tenant=lumen`

```json
{
  "actorRole": "receptionist",
  "actorName": "Sana Waheed",
  "branchName": "Gulberg",
  "amount": 2300
}
```

## Acknowledge critical alert

`POST /api/alerts/crit_lum_1/acknowledge?tenant=lumen`

```json
{
  "actorRole": "pathologist",
  "actorName": "Dr. Mehak Ali"
}
```

## Validate result

`PATCH /api/results/res_lum_1/validate?tenant=lumen`

```json
{
  "actorRole": "pathologist",
  "actorName": "Dr. Mehak Ali",
  "branchName": "Central Lab"
}
```

## Preview branded notification

`POST /api/notifications/preview?tenant=lumen`

```json
{
  "key": "reportReleased",
  "channel": "email",
  "variables": {
    "reportNumber": "RPT-LUM-4401",
    "releasedBy": "Dr. Mehak Ali"
  }
}
```

## Release report

`POST /api/reports/rep_lum_1/release?tenant=lumen`

```json
{
  "actorRole": "pathologist",
  "actorName": "Dr. Mehak Ali"
}
```

## Amend released report

`POST /api/reports/rep_lum_1/amend?tenant=lumen`

```json
{
  "actorRole": "pathologist",
  "actorName": "Dr. Mehak Ali",
  "branchName": "Central Lab",
  "note": "Corrected interpretive note after clinician review."
}
```

Release is blocked when:

- any result for the order is not `validated`
- any critical alert for the order remains `open`
