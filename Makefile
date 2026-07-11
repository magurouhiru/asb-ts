create_image: create_image_discord_bot

create_image_discord_bot:
	docker build -t asb-ts_discord-bot:latest -f discord-bot.Dockerfile .