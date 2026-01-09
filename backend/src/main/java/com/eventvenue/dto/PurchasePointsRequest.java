package com.eventvenue.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchasePointsRequest {
    private Long points;
    private Double amount;
    private String paymentMethod;
    private String transactionId;
    private String cardLast4;
}
