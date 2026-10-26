package br.com.clinic.visit;

public final class CpfValidator {
    private CpfValidator() {}
    public static boolean isValid(String input) {
        if (input == null) return false;
        String cpf = input.replaceAll("\\D", "");
        if (cpf.length() != 11 || cpf.chars().distinct().count() == 1) return false;
        int first = digit(cpf.substring(0, 9), 10);
        int second = digit(cpf.substring(0, 9) + first, 11);
        return cpf.charAt(9) - '0' == first && cpf.charAt(10) - '0' == second;
    }
    private static int digit(String value, int weight) {
        int sum = 0;
        for (char digit : value.toCharArray()) sum += (digit - '0') * weight--;
        int remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }
}

