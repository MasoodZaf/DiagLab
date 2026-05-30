# Workflow Rules

## Actor permissions

| Step | Patient | Receptionist | Phlebotomist | Technician | Pathologist | Branch Manager | Super Admin |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Register patient | No | Yes | No | No | No | No | Yes |
| Create order | Limited self-service | Yes | No | No | No | No | Yes |
| Assign collection | No | Yes | No | No | No | Yes | Yes |
| Collect sample | No | No | Yes | No | No | No | No |
| Receive sample | No | No | No | Yes | No | No | No |
| Enter result | No | No | No | Yes | No | No | No |
| Validate result | No | No | No | Limited review flags | Yes | No | No |
| Release report | No | No | No | No | Yes | No | No |
| Amend report | No | No | No | No | Yes | No | Yes |

## Sample workflow

`registered -> scheduled -> collected -> in_transit -> received -> processing -> completed -> verified -> released`

Exception paths:

- `registered -> cancelled`
- `collected -> rejected`
- `received -> rejected`
- `released -> amended`

Rules:

- Rejection requires reason, actor, and timestamp
- Recollection creates a new sample linked to the rejected predecessor
- Only verified results are eligible for release

## Result release workflow

1. Technician enters or imports draft results
2. System applies delta, reference, and critical checks
3. Pathologist validates or returns for correction
4. Release produces an immutable report version
5. Later changes create an amendment with full audit linkage

## Critical result handling

- Critical values create an alert event
- Alert requires acknowledgment by an authorized operator
- Release is blocked until alert handling is recorded

## Billing workflow

`draft -> issued -> partially_paid -> paid -> refunded`

Rules:

- Orders may be collected before payment only when tenant policy allows credit workflows
- Refunds preserve original invoice and create reversing entries
