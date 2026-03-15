package com.aimarketplace.aimarketplace.security;

import com.aimarketplace.aimarketplace.entity.Role;
import com.aimarketplace.aimarketplace.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;


public class UserPrincipal implements UserDetails {


//    UserPrincipal is a custom class that implements the
//    UserDetails interface and acts as a bridge between
//    the application's User entity and Spring Security.

//    // or
//    A class that implements UserDetails and wraps
//    the User entity so Spring Security can use it.

// spring work on userDetaisl so we have to convert user into usesrPrinciple
    // so that spring security can use it

    // take the user of my database
    private User user;

    public UserPrincipal(User user) {
        this.user = user;

    }
    // making a getter for using further
    public User getUser() {
        return user;
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public boolean isAccountNonLocked() {
        return user.isAccountNonLocked();
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    public boolean isAccountNonExpired() {
        return true;
    }

    public boolean isCredentialsNonExpired() {
        return true;
    }


    // convert User roles → Spring Security authorities

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {

        List<GrantedAuthority> authorities = new ArrayList<>();

        for (Role role : user.getRoles()) {
            authorities.add(() -> role.getName());
        }

        return authorities;
    }
}
