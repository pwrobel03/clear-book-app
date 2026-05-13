package com.clearbook.api.doctor;

import com.clearbook.api.model.DoctorProfile;
import com.clearbook.api.model.User;
import com.clearbook.api.model.VerificationStatus;
import com.clearbook.api.repository.UserRepository;
import com.clearbook.api.repository.DoctorProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class VerificationController {

    private final FileStorageService fileStorageService;
    private final DoctorProfileRepository doctorRepository;

    @PostMapping("/upload")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<String> uploadLicense(@RequestParam("file") MultipartFile file,
                                                @AuthenticationPrincipal User user) {

        // We're looking for the DoctorProfile associated with the current user, not the User entity itself, because the verification status is part of the DoctorProfile
        DoctorProfile doctor = doctorRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("Doctor profile not found for current user."));

        // Save file and get the stored file name/path
        String fileName = fileStorageService.storeFile(file);

        // Update the doctor's profile with the new file path and set verification status to PENDING
        doctor.setLicenseFilePath(fileName);
        doctor.setVerificationStatus(VerificationStatus.PENDING);
        doctorRepository.save(doctor);

        return ResponseEntity.ok("Plik przesłany pomyślnie. Profil lekarza oczekuje na weryfikację.");
    }

    @GetMapping("/document/{fileName}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or @securityService.isLicenseOwner(#user, #fileName)")
    public ResponseEntity<Resource> getDocument(@PathVariable String fileName) throws IOException {
        // This endpoint allows admins/managers to view any document, but doctors can only view their own uploaded license. The securityService.isLicenseOwner method checks if the current user is the owner of the document.
        Resource resource = fileStorageService.loadFileAsResource(fileName);

        String contentType = Files.probeContentType(resource.getFile().toPath());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}