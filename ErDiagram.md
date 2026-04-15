# ER Diagram

All 8 tables from the Prisma schema with field names, types, and relationships.

```mermaid
erDiagram

    users {
        string id PK
        string email UK
        string username UK
        string password_hash
        string first_name
        string last_name
        datetime created_at
        datetime updated_at
    }

    trading_accounts {
        string id PK
        string user_id FK
        string name
        string broker
        string account_number
        string base_currency
        decimal balance
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    trades {
        string id PK
        string trading_account_id FK
        string symbol
        enum direction
        enum order_type
        enum status
        decimal quantity
        decimal entry_price
        decimal exit_price
        decimal limit_price
        decimal stop_price
        datetime opened_at
        datetime closed_at
        string notes
        datetime created_at
        datetime updated_at
    }

    positions {
        string id PK
        string trade_id FK UK
        decimal realized_pnl
        decimal return_pct
        int duration_mins
        decimal max_drawdown
        decimal max_profit
        datetime created_at
        datetime updated_at
    }

    emotion_logs {
        string id PK
        string trade_id FK
        enum phase
        enum emotion_type
        int intensity
        string notes
        datetime logged_at
    }

    analytics_reports {
        string id PK
        string user_id FK
        string report_type
        json data
        boolean is_stale
        datetime generated_at
        datetime created_at
        datetime updated_at
    }

    tags {
        string id PK
        string user_id FK
        string name
        string color
        datetime created_at
        datetime updated_at
    }

    trade_tags {
        string id PK
        string trade_id FK
        string tag_id FK
        datetime created_at
    }

    users ||--o{ trading_accounts : "has"
    users ||--o{ analytics_reports : "has"
    users ||--o{ tags : "creates"
    trading_accounts ||--o{ trades : "contains"
    trades ||--o| positions : "produces"
    trades ||--o{ emotion_logs : "has"
    trades ||--o{ trade_tags : "tagged with"
    tags ||--o{ trade_tags : "applied via"
```
