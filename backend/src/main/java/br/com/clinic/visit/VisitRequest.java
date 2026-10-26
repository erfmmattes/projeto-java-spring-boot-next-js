package br.com.clinic.visit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record VisitRequest(
    @NotBlank(message = "Informe o nome.")
    @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres.")
    String name,
    @NotBlank(message = "Informe o CPF.")
    @Pattern(regexp = "[0-9.\\-/ ]{11,14}", message = "Informe um CPF válido.")
    String cpf
) {}

