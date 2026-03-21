package com.aimarketplace.aimarketplace.entity;


import java.time.Instant;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

//for making the collection/table  in mongodb

import com.aimarketplace.aimarketplace.enums.ERole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;


@Document(collection =  "users")
@Data               // generate getName SetAge etc
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id ;




    // for storing nonce
    @Field("nonce")
    private  String nonce ;

    @Field("createdAt")
    private Long Nonce_createdAt;





    @Field("verification_token")   // key
    private String verificationToken ;   // value

    @Field("verification_token_expiry")
    private Instant verificationTokenExpiry;


    @Field("reset_password_token")
    private  String  ResetPasswordToken;

    @Field("reset_password_token_expiry")
    private Instant resetPasswordTokenExpiry;

    @Field("failed_attempt")
    private long failedAttempt = 0 ;


    @Field("lock_time")
    private  Instant localTime;


    @Field("account_non_locked")
    private  boolean accountNonLocked =  true  ;

    @Field("created_at")
    private  Instant createdAt;

    @Field("modified_at")
    private  Instant modifiedAt ;

    @Field("wallet_address")
    private String walletAddress ;



    @Field("owned_model")
    private List<String> ownedModel;
    @Field("purchased_model")
    private List<String> purchasedModel;


    // making foreign key
    @DBRef
    @Field("role")
    private Set<Role> roles  =  new HashSet<>();


    // method to add the role
    public  void addRole(Role role){
        this.roles.add(role);
    }

    // function for removing of role
    public  void removeRole(Role role){
        this.roles.remove(role);

    }

    // verifying is has the same role as menthion
    public boolean hasRole(ERole roleName) {

        for (Role role : roles) {

            if (role.getName().equals(roleName.name())){
                return true;
            }

        }

        return false;
    }
    // increase failure intempt

    public  void  increaseFailureAttempt(){
        this.failedAttempt++;
    }

    public  void resetFailedAttempts(){
        this.failedAttempt = 0 ;
    }
    // lock the account
    public void lock(){
        this.accountNonLocked = false;
        this.localTime = Instant.now();
    }

    // unlock the account
    public void unLock(){
        this.accountNonLocked= true;
        this.localTime =  null;
        this.failedAttempt = 0 ;

    }









}
