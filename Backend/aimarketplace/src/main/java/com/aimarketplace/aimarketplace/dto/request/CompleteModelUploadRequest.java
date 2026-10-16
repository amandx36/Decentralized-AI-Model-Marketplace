package com.aimarketplace.aimarketplace.dto.request;

import lombok.Data;

@Data
public class CompleteModelUploadRequest {
    private String cid;
    private String fileId;
    private Long actualSize;
}
