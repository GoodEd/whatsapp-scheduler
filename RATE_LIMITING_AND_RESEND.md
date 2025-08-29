# Rate Limiting and Failed Message Resend Features

## Overview

This document describes the new rate limiting and failed message resend functionality added to the WhatsApp Scheduler application.

## New Features

### 1. Rate Limiting for Subgroup Messages

When sending messages to subgroups, you can now control the rate at which messages are sent to prevent API throttling and reduce failures.

**Endpoint**: `POST /api/subgroups/:id/send`

**New Parameter**:
- `rate_limit_delay` (optional): Delay between messages in milliseconds (default: 2000ms)

**How it works**:
- Each message to groups in a subgroup is scheduled with a progressive delay
- For immediate sending: messages are sent at `now + (index * delay)`
- For scheduled sending: messages are sent at `scheduled_time + (index * delay)`
- Each message is also tagged with `subgroup_id` for tracking

**Example Request**:
```json
{
  "type": "text",
  "body": "Hello everyone!",
  "send_at": 1640995200,
  "send_immediately": false,
  "rate_limit_delay": 3000
}
```

### 2. Failed Message Tracking

Failed messages are now better tracked with the following enhancements:
- Messages include `subgroup_id` field to identify which subgroup they belong to
- Enhanced error details storage
- Better status tracking

### 3. Failed Message Resend Functionality

Three new endpoints for handling failed message resends:

#### Get Failed Messages
**Endpoint**: `GET /api/failed-messages`

Returns all failed messages with their details and scheduled times.

**Response**:
```json
{
  "failed_messages": [
    {
      "type": "text",
      "group_id": "1234567890",
      "body": "Test message",
      "send_at": "1640995200",
      "status": "failed",
      "error_details": "Request timeout",
      "scheduled_time": "31/12/2021, 5:30:00 PM IST",
      "subgroup_id": "abc-123"
    }
  ],
  "count": 1
}
```

#### Resend Specific Failed Messages
**Endpoint**: `POST /api/resend-failed`

Resend specific failed messages by their indices.

**Request**:
```json
{
  "message_indices": [0, 1, 2],
  "rate_limit_delay": 3000
}
```

**Response**:
```json
{
  "success": true,
  "message": "3 failed messages rescheduled for resending with 3000ms delay",
  "resend_count": 3,
  "rate_limit_delay": 3000
}
```

#### Resend All Failed Messages for a Subgroup
**Endpoint**: `POST /api/subgroups/:id/resend-failed`

Resend all failed messages for a specific subgroup.

**Request**:
```json
{
  "rate_limit_delay": 3000
}
```

**Response**:
```json
{
  "success": true,
  "message": "5 failed messages from subgroup rescheduled for resending with 3000ms delay",
  "resend_count": 5,
  "rate_limit_delay": 3000
}
```

## Usage Examples

### 1. Send Message to Subgroup with Rate Limiting

```bash
curl -X POST http://localhost:3001/api/subgroups/your-subgroup-id/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "body": "Important announcement!",
    "send_at": 1640995200,
    "rate_limit_delay": 5000
  }'
```

### 2. Check Failed Messages

```bash
curl -X GET http://localhost:3001/api/failed-messages
```

### 3. Resend Failed Messages

```bash
curl -X POST http://localhost:3001/api/resend-failed \
  -H "Content-Type: application/json" \
  -d '{
    "message_indices": [0, 1],
    "rate_limit_delay": 4000
  }'
```

### 4. Resend All Failed Messages for a Subgroup

```bash
curl -X POST http://localhost:3001/api/subgroups/your-subgroup-id/resend-failed \
  -H "Content-Type: application/json" \
  -d '{
    "rate_limit_delay": 3000
  }'
```

## Configuration

### Rate Limiting Defaults
- **Subgroup messages**: 2000ms (2 seconds) delay between messages
- **Resend messages**: 3000ms (3 seconds) delay between messages

### Recommended Settings
- For small subgroups (< 10 groups): 1000-2000ms delay
- For medium subgroups (10-50 groups): 2000-5000ms delay  
- For large subgroups (> 50 groups): 5000-10000ms delay

## Benefits

1. **Reduced API Failures**: Rate limiting prevents overwhelming the WhatsApp API
2. **Better Reliability**: Failed messages can be easily identified and resent
3. **Improved Tracking**: Subgroup association helps with troubleshooting
4. **Flexible Control**: Configurable delays for different use cases
5. **Automatic Processing**: Resent messages are automatically processed

## Technical Notes

- Rate limiting is implemented at the scheduling level, not processing level
- Failed messages maintain all original metadata when resent
- Resend operations reset error details and status
- Progressive delays ensure messages are sent in sequence
- All resend operations trigger immediate processing