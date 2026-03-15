package com.aimarketplace.aimarketplace.repository;

import com.aimarketplace.aimarketplace.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByUsername(String username);
    Optional<User> findByWalletAddress(String walletAddress);
    Optional<User> findByEmail(String email);

    @Query("{ $or: [ { 'username': ?0 }, { 'email': ?1 } ] }")
    Optional<User> findByUsernameOrEmail(String username, String email);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    Optional<User> findByVerificationToken(String verificationToken);

    @Query("{ 'reset_password_token': ?0 }")
    Optional<User> findByResetPasswordToken(String token);

    @Query("{ 'email': ?0 }")
    @Update("{ '$set': { 'enabled': true, 'verification_token': null } }")
    void enableUserByEmail(String email);

    @Query("{ 'username': ?0 }")
    @Update("{ '$inc': { 'failed_attempts': 1 } }")
    void incrementFailedAttempts(String username);

    @Query("{ 'username': ?0 }")
    @Update("{ '$set': { 'failed_attempts': 0, 'account_non_locked': true, 'lock_time': null } }")
    void resetLock(String username);

    @Query("{ 'username': ?0 }")
    @Update("{ '$set': { 'account_non_locked': false, 'lock_time': ?1 } }")
    void lockAccount(String username, Instant lockTime);

    @Query("{ 'account_non_locked': false, 'lock_time': { $lt: ?0 } }")
    java.util.List<User> findLockedAccountsBefore(Instant time);
}