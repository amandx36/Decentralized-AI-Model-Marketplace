package com.aimarketplace.aimarketplace.entity;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;

import java.util.Collection;

//for making the collection/table  in mongodb

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Document(collection =  "users")
@Data               // generate getName SetAge etc
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id ;

    @NotBlank
    @Size(max = 30)
    @Field("username")    // key
    private  String username;  // value 



}
