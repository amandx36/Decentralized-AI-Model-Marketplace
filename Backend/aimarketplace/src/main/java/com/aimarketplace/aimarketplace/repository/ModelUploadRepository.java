package com.aimarketplace.aimarketplace.repository;

import com.aimarketplace.aimarketplace.entity.ModelUpload;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ModelUploadRepository extends MongoRepository<ModelUpload, String> {
}
