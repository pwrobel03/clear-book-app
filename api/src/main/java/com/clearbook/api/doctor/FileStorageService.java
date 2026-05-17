package com.clearbook.api.doctor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    // Ścieżka do folderu, w którym będą zapisywane pliki (stworzy się w głównym folderze API)
    private final Path fileStorageLocation = Paths.get("uploads/licenses").toAbsolutePath().normalize();

    public FileStorageService() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Nie można utworzyć katalogu na pliki.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        // Zabezpieczenie przed atakami Path Traversal i nadpisywaniem plików
        String originalName = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = originalName.substring(originalName.lastIndexOf("."));

        // Generujemy unikalną nazwę pliku, żeby lekarze nie nadpisali sobie nawzajem "licencja.pdf"
        String newFileName = UUID.randomUUID() + extension;

        try {
            if (newFileName.contains("..")) {
                throw new RuntimeException("Plik zawiera niedozwolone znaki w nazwie: " + newFileName);
            }

            Path targetLocation = this.fileStorageLocation.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return newFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Nie udało się zapisać pliku " + newFileName, ex);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("Plik nie istnieje: " + fileName);
            }
        } catch (Exception ex) {
            throw new RuntimeException("Błąd podczas pobierania pliku: " + fileName, ex);
        }
    }
}