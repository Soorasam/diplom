import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import { CheckoutCartDto, CreateCartItemDto, UpdateCartItemDto } from './dto/cart-item.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cart: CartService) {}

  @Get()
  getCart(@CurrentUser() user: User) {
    return this.cart.getCart(user);
  }

  @Post('items')
  addItem(@CurrentUser() user: User, @Body() dto: CreateCartItemDto) {
    return this.cart.addItem(user, dto);
  }

  @Patch('items/:id')
  updateItem(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.updateItem(user, id, dto.quantity);
  }

  @Delete('items/:id')
  removeItem(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.cart.removeItem(user, id);
  }

  @Delete()
  clear(@CurrentUser() user: User) {
    return this.cart.clear(user);
  }

  @Post('checkout')
  checkout(@CurrentUser() user: User, @Body() dto: CheckoutCartDto) {
    return this.cart.checkout(user, dto);
  }
}
