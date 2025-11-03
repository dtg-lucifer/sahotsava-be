# run the server
all: setup
	bun run src/index.ts

# Run the server in watch mode for live changes
dev:
	bun run dev

# Run the database along side the redis cache
db:
	sudo docker compose -f docker/docker-compose.yaml up postgres redis

# Clean the log files along side the prisma generated clients
clean:
	rm -rf logs/ src/prisma/generated/

setup:
	bun install
	bun run prisma:generate

# Generate the prisma client
prisma-generate:
	bun run prisma:generate

# Run the prisma migrations
prisma-migrate:
	bun run prisma:migrate

# Open the prisma studio
prisma-studio:
	bun run prisma:studio
