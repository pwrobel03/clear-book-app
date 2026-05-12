package com.clearbook.api.crud;

import com.clearbook.api.AbstractIntegrationTest;
import com.clearbook.api.model.CenterStatus;
import com.clearbook.api.model.CenterType;
import com.clearbook.api.model.MedicalCenter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Complex CRUD operations for MedicalCenter entity")
class MedicalCenterIntegrationTest extends AbstractIntegrationTest {

    @Test
    @DisplayName("Should execute full CRUD cycle for MedicalCenter entity")
    void shouldExecuteFullCrudCycle() {
        // Create - add a new medical center to the database
        MedicalCenter newCenter = MedicalCenter.builder()
                .name("Cardiology Clinic")
                .city("Cracow")
                .type(CenterType.CLINIC)
                .status(CenterStatus.ACTIVE)
                .build();

        MedicalCenter savedCenter = centerRepository.save(newCenter);
        assertThat(savedCenter.getId()).isNotNull();

        // Read - retrieve the medical center by its ID and verify the data
        Optional<MedicalCenter> foundCenter = centerRepository.findById(savedCenter.getId());
        assertThat(foundCenter).isPresent();
        assertThat(foundCenter.get().getName()).isEqualTo("Cardiology Clinic");

        // Update - change the city of the medical center and save the changes
        MedicalCenter centerToUpdate = foundCenter.get();
        centerToUpdate.setCity("Warsaw");
        centerRepository.save(centerToUpdate);

        MedicalCenter updatedCenter = centerRepository.findById(savedCenter.getId()).orElseThrow();
        assertThat(updatedCenter.getCity()).isEqualTo("Warsaw");

        // Delete - remove the medical center from the database and verify it no longer exists
        centerRepository.delete(updatedCenter);
        Optional<MedicalCenter> deletedCenter = centerRepository.findById(savedCenter.getId());
        assertThat(deletedCenter).isEmpty();
    }
}