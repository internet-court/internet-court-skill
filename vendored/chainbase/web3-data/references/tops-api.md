# Tops Social Intelligence API Reference

**Service:** [Tops](https://tops.chainbase.com) — crypto social intelligence
**Base URL:** `https://api.chainbase.com/tops`
**Auth:** No API key required
**Rate limit:** 10 req/s · 60 req/min · 600 req/hour (per client IP)

## CLI Commands

All `chainbase tops` subcommands call these endpoints internally.

---

## Endpoints

### GET /v1/tool/list-trending-topics

List currently trending crypto narratives, ranked by heat score.

**CLI:** `chainbase tops trending [--language <lang>]`

**Query params:**

| Name | Type | Required | Description |
|---|---|---|---|
| `language` | string | No | `zh` / `en` / `ko`. Default: `en` |

**Response:** `ItemsResponse<Story>`

```json
{
  "count": 20,
  "items": [
    {
      "id": "abc123",
      "keyword": "AI Agent",
      "summary": "...",
      "score": 98.5,
      "current_rank": 1,
      "rank_status": "up",
      "is_new": false,
      "authors": ["@user1", "@user2"],
      "tweet_urls": ["https://twitter.com/..."],
      "first_tweet_time": "2026-03-23T00:00:00Z",
      "snapshot_time": "2026-03-23T06:00:00Z"
    }
  ]
}
```

---

### GET /v1/tool/get-topic

Fetch structured details for one topic.

**CLI:** `chainbase tops topic <topic_id>`

**Query params:**

| Name | Type | Required | Description |
|---|---|---|---|
| `topic_id` | string | Yes | Topic ID from trending list or search |

**Response:** `DataResponse<Story>`

```json
{
  "data": { /* Story object */ }
}
```

---

### GET /v1/tool/get-topic-posts

Retrieve posts/tweets under a topic.

**CLI:** `chainbase tops posts <topic_id>`

**Query params:**

| Name | Type | Required | Description |
|---|---|---|---|
| `topic_id` | string | Yes | Topic ID |

**Response:** `ItemsResponse<Tweet>`

```json
{
  "count": 50,
  "items": [
    {
      "id": "tweet_id",
      "text": "Tweet body...",
      "media_json": "[]",
      "user": {
        "user_id": "123",
        "name": "Vitalik Buterin",
        "screen_name": "VitalikButerin",
        "blue_verified": true,
        "profile_image": "https://..."
      }
    }
  ]
}
```

---

### GET /v1/tool/search-narrative-candidates

Reverse-search topic candidates from a human keyword.

**CLI:** `chainbase tops search <keyword>`

**Query params:**

| Name | Type | Required | Description |
|---|---|---|---|
| `keyword` | string | Yes | e.g. `RWA`, `AI Agent`, `Restaking` |

**Response:** `ItemsResponse<Story>` — candidate topics with match rationale

---

### GET /v1/tool/search-mentions

Search recent Twitter/X mentions for a keyword.

**CLI:** `chainbase tops mentions <keyword>`

**Query params:**

| Name | Type | Required | Description |
|---|---|---|---|
| `keyword` | string | Yes | Keyword to search |

**Response:** `ItemsResponse<Tweet>`

---

## Data Schemas

### Story

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique topic ID (use as `topic_id`) |
| `keyword` | string | Core keyword |
| `summary` | string | AI-generated topic summary |
| `score` | number | Heat/trend score |
| `current_rank` | integer | Current ranking position |
| `rank_status` | string | `new` / `up` / `down` / `same` |
| `is_new` | boolean | First appearance in top stories |
| `is_manual` | boolean | Manually curated |
| `authors` | string[] | Key authors |
| `tweet_urls` | string[] | Representative tweet URLs |
| `first_tweet_time` | string | Timestamp of first tweet |
| `snapshot_time` | string | Snapshot timestamp |
| `analysis_time` | string | Analysis timestamp |
| `source_type` | string | Data source type |

### Tweet

| Field | Type | Description |
|---|---|---|
| `id` | string | Tweet ID |
| `text` | string | Tweet body |
| `media_json` | string | Media attachments (JSON string) |
| `user` | XUser | Author info |

### XUser

| Field | Type | Description |
|---|---|---|
| `user_id` | string | User ID |
| `name` | string | Display name |
| `screen_name` | string | @handle |
| `blue_verified` | boolean | Blue checkmark verified |
| `profile_image` | string | Avatar URL |

---

## Error Handling

| HTTP Status | Description |
|---|---|
| 400 | Bad Request — invalid parameters |
| 429 | Too Many Requests — rate limit exceeded |

Error format: `{ "error": "description" }`
