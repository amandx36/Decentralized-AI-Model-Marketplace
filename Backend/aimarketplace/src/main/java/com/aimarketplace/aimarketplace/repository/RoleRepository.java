package com.aimarketplace.aimarketplace.repository;

import com.aimarketplace.aimarketplace.enums.ERole;
import com.aimarketplace.aimarketplace.entity.Role;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RoleRepository extends MongoRepository<Role,String > {


    Optional <Role> findByName(ERole name);
    Boolean existsByName(ERole name);
}
