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

    /** Allowed MIME types for license documents. */
    private static final java.util.Set<String> ALLOWED_MIME_TYPES = java.util.Set.of(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png"
    );

    public String storeFile(MultipartFile file) {
        // Validate MIME type — licenses must be PDF or a photo of the document
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Invalid file type. Only PDF, JPG and PNG are accepted for license documents.");
        }

        // Derive a safe extension from the known MIME type (never from user-supplied filename)
        String extension = switch (contentType.toLowerCase()) {
            case "application/pdf"  -> ".pdf";
            case "image/png"        -> ".png";
            default                 -> ".jpg"; // image/jpeg and image/jpg
        };

        // UUID prefix guarantees uniqueness and eliminates any path-traversal risk
        String newFileName = UUID.randomUUID() + extension;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored license file: {}", newFileName);
            return newFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Failed to save file: " + newFileName, ex);
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