package com.aimarketplace.aimarketplace.dto.request;


import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

public class ModalUploadRequest {

    private   String name ;
    private  String description ;
    private BigDecimal  price ;
    private String category ;
    private MultipartFile file  ;
}
