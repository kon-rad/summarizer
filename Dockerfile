# Specify the base Docker image
FROM oven/bun:1.2

# Copy source files
COPY . ./

# Install all dependencies
RUN bun install --production

# Run the Actor
CMD bun run start
