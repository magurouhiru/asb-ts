create_image: create_image_discord_bot

create_image_discord_bot:
	docker build -t ast_ts__discord_bot:latest -f discord-bot.Dockerfile .