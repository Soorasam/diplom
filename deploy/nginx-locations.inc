    location ^~ /api/ {
        client_max_body_size 25M;
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location ^~ /coop-products/ {
        proxy_pass http://127.0.0.1:9000/coop-products/;
        proxy_set_header Host $host;
    }

    location ^~ /coop-driver-docs/ {
        proxy_pass http://127.0.0.1:9000/coop-driver-docs/;
        proxy_set_header Host $host;
    }

    location ^~ /coop-tickets/ {
        proxy_pass http://127.0.0.1:9000/coop-tickets/;
        proxy_set_header Host $host;
    }
