package br.com.clinic.visit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.util.Map;

@Component
public class HttpBinClient {
    private final RestClient client;
    public HttpBinClient(RestClient.Builder builder, @Value("${app.httpbin-url}") String url) {
        this.client = builder.baseUrl(url).build();
    }
    public String fetchProtocol() {
        Map<?, ?> response = client.get().retrieve().body(Map.class);
        Object uuid = response == null ? null : response.get("uuid");
        if (uuid == null || uuid.toString().isBlank()) throw new IllegalStateException("O HTTPBin não retornou um protocolo.");
        return uuid.toString();
    }
}

