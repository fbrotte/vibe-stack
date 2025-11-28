#!/bin/bash
set -e

# Create langfuse database for observability
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE langfuse;
    GRANT ALL PRIVILEGES ON DATABASE langfuse TO $POSTGRES_USER;
EOSQL

echo "Databases created successfully!"
