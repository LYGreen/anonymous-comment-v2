# Anonymous Comment

## Technology

__Frontend__: Vue3
__Serverless__: Cloudflare Workers
__Authorization__: Authenticate using ```ADMIN_KEY```
__Notification__: Discord Bot with WebHook URL

## Environment Variables and Secrets
__On Cloudflare__:
- worker_name (default: serverless)
- database_name
- database_id
- DISCORD_WEBHOOK_URL
- ALLOW_CORS_ORIGIN (if just for testing, it can be set to ```http://localhost:5173```. Don't set this value on production environment)

__On Web__:
- VITE_CLOUDFLARE_WORKERS_URL
- VITE_ADMIN_AVATAR_URL

## Usage

### Step1:
Create a ```D1 Database``` On Cloudflare
### Setp2:
Run these commands on ```D1 Database Console``` to create a ```comments``` table and a ```v_mixed_comments``` view
```sql
CREATE TABLE comments (
    id INTEGER PRIMARY KEY NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    content VARCHAR(255) NOT NULL,
    quote_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role VARCHAR(255) CHECK (role IN ('user', 'admin')) DEFAULT 'user' NOT NULL
    );

CREATE VIEW v_mixed_comments AS
SELECT 
    c.*, 
    q.user_id AS quoted_user_id, 
    q.content AS quoted_content, 
    q.created_at AS quoted_created_at,
    q.quote_id AS quoted_quoted_id,
    q.role AS quoted_role
FROM comments c 
LEFT JOIN comments q ON c.quote_id = q.id;
```
### Step3 (Optional):
Set up a Discord Bot on a server, then remember its ```Webhook URL```
### Step4:
Clone this repository.
### Step5:
run ```npm install```
### Step6:
Configure environment variables on Cloudflare Workers: ```cd serverless```, rename ```wrangler.example.jsonc``` to ```wrangler.jsonc```
### Step7:
Fill these values in ```wrangler.jsonc```
```
worker_name (default: serverless)
database_name
database_id
DISCORD_WEBHOOK_URL
ALLOW_CORS_ORIGIN
```
### Step8:
Create a secret with ```npx wrangler secret put ADMIN_KEY```. Its value can be ```UUID```. Run ```npx wrangler secret list``` to check it, and run ```npx wrangler secret delete ADMIN_KEY```
### Step9:
Generate configuration and deploy to Cloudflare Workers: ```npm run cf-typegen && npm run deploy```
### Step10:
Configure web: ```cd ../web```, rename ```example.env``` to ```.env```
### Step11:
Fill these values in ```.env```
```toml
VITE_CLOUDFLARE_WORKERS_URL=
VITE_ADMIN_AVATAR_URL=
```
### Step12:
Run frontend: ```npm run dev```

## Deploy Frontend on Github
Create these variables on Github:
```
VITE_CLOUDFLARE_WORKERS_URL
VITE_ADMIN_AVATAR_URL
```
