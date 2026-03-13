package com.aimarketplace.aimarketplace.entity;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import javax.validation.constraints.NotBlank;

@Document(collection = "role")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Role {

    @Id
    @NotBlank
    private String id ;

    @Indexed(unique = true)
    @Field("name")
    private String name ;

    @NotBlank
    @Field("description")
    private String description;

    public  Role(ERole  role , String description){
       // return the name inside the enum dude
        this.name  = role.name() ;
        this.description = description ;
    }


}
