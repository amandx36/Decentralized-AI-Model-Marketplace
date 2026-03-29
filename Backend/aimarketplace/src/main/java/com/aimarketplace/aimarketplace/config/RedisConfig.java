package com.aimarketplace.aimarketplace.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {


    // make template  of java to interact with redish
    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory connectionFactory) {
        // new redis template
        RedisTemplate<String, String> template = new RedisTemplate<>();

        // attach redis  connection
        template.setConnectionFactory(connectionFactory);

        // redis data in bytes
        // convert key into string
        template.setKeySerializer(new StringRedisSerializer());

        // convert value into string
        template.setValueSerializer(new StringRedisSerializer());


        return template;


    }

}
